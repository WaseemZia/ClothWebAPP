using API.Data;
using API.Hubs;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<StockHub> _stockHub;

        public SalesController(AppDbContext context,IHubContext<StockHub> stockHub)
        {
            _context = context;
            _stockHub=stockHub;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSales()
        {
            var sale= await _context.Sales.Include(s => s.Item)
            .Include(x=>x.Customer)
            .OrderByDescending(s => s.SaleDate).ToListAsync();
            return Ok(sale);
        }

        [HttpPost]
        public async Task<ActionResult<Sale>> PostSale(Sale sale)
        {
            var item = await _context.Items.FindAsync(sale.ItemId);
            if (item == null) return NotFound("Item not found");
            if(sale.CustomerId.HasValue)
            {
                var customer=await _context.Customers.FindAsync(sale.CustomerId);
                if(customer==null) return NotFound("Customer not found");
            }
            decimal totalToDeduct = 0;
            
            // CALCULATE DEDUCTION BASED ON GENDER & TYPE
            if (item.GenderCategory == "Men")
            {
                // Men: Always calculate by meters
                totalToDeduct = sale.QuantitySold * item.MetersPerSuit;
                
                if (item.RemainingQuantity < totalToDeduct)
                    return BadRequest($"Not enough stock. Need {totalToDeduct}m, have {item.RemainingQuantity}m");
            }
            else if (item.GenderCategory == "Women")
            {
                if (item.SuitType == "Unstitched")
                {
                    // Women Unstitched: Calculate by meters
                    totalToDeduct = sale.QuantitySold * item.MetersPerSuit;
                    
                    if (item.RemainingQuantity < totalToDeduct)
                        return BadRequest($"Not enough stock. Need {totalToDeduct}m, have {item.RemainingQuantity}m");
                }
                else
                {
                    // Women Stitched: Deduct by pieces
                    totalToDeduct = sale.QuantitySold;
                    
                    if (item.RemainingQuantity < totalToDeduct)
                        return BadRequest($"Not enough stock. Need {totalToDeduct} pieces, have {item.RemainingQuantity} pieces");
                }
            }
            
            // Calculate sale amount
            sale.TotalSalesAmount = sale.QuantitySold * sale.SoldRate;
            sale.SaleDate = DateTime.UtcNow;
            
            if(sale.AmountPaid<sale.TotalSalesAmount)
            {
                sale.IsLoan=true;
                sale.LoanAmount=sale.TotalSalesAmount-sale.AmountPaid;
            }
            else
            {
                sale.IsLoan=false;
                sale.LoanAmount=0;
            }
            // Deduct stock
            item.RemainingQuantity -= totalToDeduct;
            
            if(item.RemainingQuantity<=5)
            {
                bool isOutOfStock=item.RemainingQuantity<=0;
                string alertMessage=isOutOfStock? $"🚨 Out of Stock: {item.Name} is completely gone!"
                 : $"⚠️ Low Stock: {item.Name} only has {item.RemainingQuantity} meters left.";
                 await _stockHub.Clients.All.SendAsync("ReceiveStockAlert",new
                 {
                      itemName=item.Name,
                      message=alertMessage,
                      isOutOfStock=isOutOfStock
                 });
                 
            }
            _context.Sales.Add(sale);
            _context.Entry(item).State = EntityState.Modified;
            
            await _context.SaveChangesAsync();
            if(sale.IsLoan && sale.CustomerId.HasValue)
            {
                var loan = new Loan
                {
                 CustomerId=sale.CustomerId.Value,
                 SaleId=sale.Id,
                 TotalAmount=sale.TotalSalesAmount,
                 AmountPaid=sale.AmountPaid,
                 RemainingBalance=sale.LoanAmount
                ,Status="Active",
                DueDate=DateTime.UtcNow
                };
                 _context.Loans.Add(loan);
        await _context.SaveChangesAsync();
            }
            
            return CreatedAtAction(nameof(GetSales), new { id = sale.Id }, sale);
        }
        [HttpGet("by-gender/{gender}")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSalesByGender(string gender)
        {
            return await _context.Sales.Include(s => s.Item)
            .Include(x=>x.Customer)
                .Where(s => s.Item != null && s.Item.GenderCategory == gender)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutSale(int id, Sale sale)
        {
            if (id != sale.Id) return BadRequest();
            
            var existingSale = await _context.Sales.FindAsync(id);
            if (existingSale == null) return NotFound("Sale not found");
            
            // Get the item to recalculate stock
            var item = await _context.Items.FindAsync(sale.ItemId);
            if (item == null) return NotFound("Item not found");
            
            // Calculate the difference in quantity
            var quantityDifference = sale.QuantitySold - existingSale.QuantitySold;
            
            // Calculate meters/pieces to deduct or restore
            decimal adjustmentAmount = 0;
            
            if (item.GenderCategory == "Men")
            {
                adjustmentAmount = quantityDifference * item.MetersPerSuit;
            }
            else if (item.GenderCategory == "Women")
            {
                if (item.SuitType == "Unstitched")
                {
                    adjustmentAmount = quantityDifference * item.MetersPerSuit;
                }
                else
                {
                    adjustmentAmount = quantityDifference;
                }
            }
            
            // Check if there's enough stock for increase
            if (quantityDifference > 0 && item.RemainingQuantity < adjustmentAmount)
            {
                return BadRequest($"Not enough stock. Need {adjustmentAmount} more, but only have {item.RemainingQuantity}");
            }
            
            // Update sale
            existingSale.ItemId = sale.ItemId;
            existingSale.QuantitySold = sale.QuantitySold;
            existingSale.SoldRate = sale.SoldRate;
            existingSale.TotalSalesAmount = sale.QuantitySold * sale.SoldRate;
            existingSale.CustomerId = sale.CustomerId;
            existingSale.AmountPaid = sale.AmountPaid;
            
            // Recalculate loan
            if (existingSale.AmountPaid < existingSale.TotalSalesAmount)
            {
                existingSale.IsLoan = true;
                existingSale.LoanAmount = existingSale.TotalSalesAmount - existingSale.AmountPaid;
            }
            else
            {
                existingSale.IsLoan = false;
                existingSale.LoanAmount = 0;
            }
            
            // Adjust stock
            item.RemainingQuantity -= adjustmentAmount;
            
            // Update or create loan if needed
            if (existingSale.IsLoan && existingSale.CustomerId.HasValue)
            {
                var existingLoan = await _context.Loans.FirstOrDefaultAsync(l => l.SaleId == existingSale.Id);
                if (existingLoan != null)
                {
                    // Update existing loan
                    existingLoan.TotalAmount = existingSale.TotalSalesAmount;
                    existingLoan.AmountPaid = existingSale.AmountPaid;
                    existingLoan.RemainingBalance = existingSale.LoanAmount;
                    _context.Entry(existingLoan).State = EntityState.Modified;
                }
                else
                {
                    // Create new loan
                    var loan = new Loan
                    {
                        CustomerId = existingSale.CustomerId.Value,
                        SaleId = existingSale.Id,
                        TotalAmount = existingSale.TotalSalesAmount,
                        AmountPaid = existingSale.AmountPaid,
                        RemainingBalance = existingSale.LoanAmount,
                        Status = "Active",
                        LoanDate = DateTime.UtcNow
                    };
                    _context.Loans.Add(loan);
                }
            }
            else
            {
                // Remove loan if sale is now fully paid
                var loanToDelete = await _context.Loans.FirstOrDefaultAsync(l => l.SaleId == existingSale.Id);
                if (loanToDelete != null)
                {
                    _context.Loans.Remove(loanToDelete);
                }
            }
            
            _context.Entry(existingSale).State = EntityState.Modified;
            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            var sale = await _context.Sales.FindAsync(id);
            if (sale == null) return NotFound("Sale not found");
            
            // Get the item to restore stock
            var item = await _context.Items.FindAsync(sale.ItemId);
            if (item != null)
            {
                // Calculate how much to restore
                decimal amountToRestore = 0;
                
                if (item.GenderCategory == "Men")
                {
                    amountToRestore = sale.QuantitySold * item.MetersPerSuit;
                }
                else if (item.GenderCategory == "Women")
                {
                    if (item.SuitType == "Unstitched")
                    {
                        amountToRestore = sale.QuantitySold * item.MetersPerSuit;
                    }
                    else
                    {
                        amountToRestore = sale.QuantitySold;
                    }
                }
                
                // Restore stock
                item.RemainingQuantity += amountToRestore;
                _context.Entry(item).State = EntityState.Modified;
            }
            
            // Delete associated loan if exists
            var loan = await _context.Loans.FirstOrDefaultAsync(l => l.SaleId == id);
            if (loan != null)
            {
                // Delete all loan payments first
                var payments = await _context.LoanPayments.Where(p => p.LoanId == loan.Id).ToListAsync();
                _context.LoanPayments.RemoveRange(payments);
                
                // Delete the loan
                _context.Loans.Remove(loan);
            }
            
            // Delete the sale
            _context.Sales.Remove(sale);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }

    }
}

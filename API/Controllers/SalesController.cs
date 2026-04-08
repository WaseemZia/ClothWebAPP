using API.Data;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SalesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSales()
        {
            return await _context.Sales.Include(s => s.Item).OrderByDescending(s => s.SaleDate).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Sale>> PostSale(Sale sale)
        {
            var item = await _context.Items.FindAsync(sale.ItemId);
            if (item == null) return NotFound("Item not found");
            
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
            
            // Deduct stock
            item.RemainingQuantity -= totalToDeduct;
            
            _context.Sales.Add(sale);
            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetSales), new { id = sale.Id }, sale);
        }
        [HttpGet("by-gender/{gender}")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSalesByGender(string gender)
        {
            return await _context.Sales.Include(s => s.Item)
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
            
            // Adjust stock
            item.RemainingQuantity -= adjustmentAmount;
            
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
            
            // Delete the sale
            _context.Sales.Remove(sale);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }

    }
}

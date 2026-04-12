using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    public class SaleReturnsController : ControllerBase
    {
    
         private readonly AppDbContext _context;
        private readonly IHubContext<StockHub> _stockHub;

        public SaleReturnsController(AppDbContext context, IHubContext<StockHub> stockHub)
        {
            _context = context;
            _stockHub = stockHub;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SaleReturns>>> SaleReturn()
        {
            var returnsSale=await _context.SaleReturns.Include(x=>x.Sale)
            .ThenInclude(x=>x!.Customer)
            .OrderByDescending(r=>r.ReturnDate)
            .Include(x=>x.Item).ToListAsync();
            return Ok(returnsSale);        
        }
        [HttpPost]
        public async Task<ActionResult<IEnumerable<SaleReturns>>> SalesReturn(SaleReturns saleReturns)
        {
            var saleID= await _context.Sales.Include(s=>s.Item).FirstOrDefaultAsync(x=>x.Id==saleReturns.SaleId);
            if(saleID== null) return BadRequest("Can Not Found SaleId");
            var itemID=await _context.Items.FindAsync(saleID.ItemId);
            if(itemID==null)return NotFound("Item Not Found");
            // how many sales already returned
            var alreadySalesReturned= await _context.SaleReturns.Where(x=>x.SaleId==saleReturns.SaleId)
            .SumAsync(x=>x.QuantityReturn);
            var remainingReturnable = saleID.QuantitySold-alreadySalesReturned;
            if(saleReturns.QuantityReturn>remainingReturnable)
            {
                return BadRequest($"Cannot return {saleReturns.QuantityReturn}. Only {remainingReturnable} suit(s) remaining to return from this sale.");
            }
            if(saleReturns.QuantityReturn<=0)  return BadRequest("Quantity to return must be at least 1.");
               // 4. Calculate stock to restore (same logic as SalesController)
            decimal stockToRestore = 0;

            if (itemID.GenderCategory == "Men")
            {
                stockToRestore = saleReturns.QuantityReturn * itemID.MetersPerSuit;
            }
            else if (itemID.GenderCategory == "Women")
            {
                if (itemID.SuitType == "Unstitched")
                {
                    stockToRestore = saleReturns.QuantityReturn * itemID.MetersPerSuit;
                }
                else
                {
                    // Women Stitched: pieces
                    stockToRestore = saleReturns.QuantityReturn;
                }
            }
            itemID.RemainingQuantity+=stockToRestore;
            //calculate refund at sold rate 
            saleReturns.RefundAmount=saleReturns.QuantityReturn*saleID.SoldRate;
            saleReturns.ItemId=saleID.ItemId;
            saleReturns.ReturnDate=DateTime.UtcNow;
            //adjust loan amont if associated with loan 
            if(saleID.IsLoan && saleID.CustomerId.HasValue)
            {
                var loan = await _context.Loans.FirstOrDefaultAsync(x=>x.SaleId==saleID.Id);
                if(loan != null){
                loan.TotalAmount-=saleReturns.RefundAmount;
                loan.RemainingBalance-=saleReturns.RefundAmount;
                    if (loan.RemainingBalance <= 0)
                    {
                        loan.RemainingBalance=0;
                        loan.Status="Cleared";
                    }
                    _context.Entry(loan).State=EntityState.Modified;
                }

            }
        _context.SaleReturns.Add(saleReturns);
        _context.Entry(itemID).State=EntityState.Modified;
        await _context.SaveChangesAsync();

        string unit = (itemID.GenderCategory == "Women" && itemID.SuitType == "Stitched") ? "pieces" : "meters";
        await _stockHub.Clients.All.SendAsync("ReceiveStockAlert", new
        {
            itemName=itemID.Name,
            message = $"📦 Stock Restored: {itemID.Name} now has {itemID.RemainingQuantity} {unit} (Return processed)",
            isOutOfStock=false
        });


            return Ok(saleReturns);
        }
    }
}
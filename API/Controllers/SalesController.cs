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
            if (item.GenderCategory == "Men")
            {
                totalToDeduct=sale.QuantitySold*item.MetersPerSuit;
                 if (item.RemainingQuantity < totalToDeduct)
                return BadRequest($"Not enough stock .Need{totalToDeduct}m,have{item.RemainingQuantity}m");
            }
            else if(item.GenderCategory=="Women")
            {
                if (item.SuitType == "Unstitched")
                {
                    // Women Unstitched: Calculate by meters
                    totalToDeduct=sale.QuantitySold*item.MetersPerSuit;
                    return BadRequest($"Not enough stock .Need{totalToDeduct}m,have{item.RemainingQuantity}m");

                }
                else
                {
                     // Women Stitched: Deduct by pieces
                     totalToDeduct=sale.QuantitySold;
                     return BadRequest($"Not enough stock .Need{totalToDeduct}m,have{item.RemainingQuantity}m");

                }
            }
              // 1. Determine how many meters to deduct per suit!
    // decimal metersPerSuit = 4.0m; // Default to Wash & Wear amount
    // // Check if the cloth name contains the word "cotton"
    // if (item.ClothType.ToLower().Contains("cotton"))
    // {
    //     metersPerSuit = 4.5m;
    // }
    // 2. Calculate the exact meter amount to deduct
    // decimal totalMetersToDeduct = sale.QuantitySold * metersPerSuit;
    sale.TotalSalesAmount=sale.QuantitySold*sale.SoldRate;
    sale.SaleDate=DateTime.UtcNow;
     // Deduct stock
     item.RemainingQuantity=-totalToDeduct;
    //  _context.Sales.Add(sale);
    //   if (item.RemainingQuantity < totalMetersToDeduct)
    //     return BadRequest($"Not enough stock. You need {totalMetersToDeduct} meters, but only have {item.RemainingQuantity} meters left.");

    //         sale.TotalSalesAmount = sale.QuantitySold * sale.SoldRate;
    //         sale.SaleDate = DateTime.UtcNow;

    //         item.RemainingQuantity -= totalMetersToDeduct;

            _context.Sales.Add(sale);
            _context.Entry(item).State = EntityState.Modified;
            
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSales), new { id = sale.Id }, sale);
        }
        [HttpGet("by-gender/{gender}")]
public async Task<ActionResult<IEnumerable<Sale>>> GetSalesByGender(string gender)
        {
           return await _context.Sales.Include(x=>x.ItemId)
            .Where(x=>x.Item!=null && x.Item.GenderCategory==gender)
            .OrderByDescending(i=>i.SaleDate).ToListAsync();
        }

    }
}

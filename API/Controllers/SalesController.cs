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
            if (item.RemainingQuantity < sale.QuantitySold)
                return BadRequest("Not enough stock remaining.");
              // 1. Determine how many meters to deduct per suit!
    decimal metersPerSuit = 4.0m; // Default to Wash & Wear amount
    // Check if the cloth name contains the word "cotton"
    if (item.ClothType.ToLower().Contains("cotton"))
    {
        metersPerSuit = 4.5m;
    }
    // 2. Calculate the exact meter amount to deduct
    decimal totalMetersToDeduct = sale.QuantitySold * metersPerSuit;
      if (item.RemainingQuantity < totalMetersToDeduct)
        return BadRequest($"Not enough stock. You need {totalMetersToDeduct} meters, but only have {item.RemainingQuantity} meters left.");

            sale.TotalSalesAmount = sale.QuantitySold * sale.SoldRate;
            sale.SaleDate = DateTime.UtcNow;

            item.RemainingQuantity -= totalMetersToDeduct;

            _context.Sales.Add(sale);
            _context.Entry(item).State = EntityState.Modified;
            
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSales), new { id = sale.Id }, sale);
        }
    }
}

using API.Data;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItemsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Item>>> GetItems()
        {
            return await _context.Items.OrderByDescending(i => i.Id).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Item>> GetItem(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<Item>> PostItem(Item item)
        {
            if (item.GenderCategory == "Men")
            {
                item.MetersPerSuit = item.ClothType.ToLower().Contains("cotton") ? 4.5m : 4m;
                item.SuitType = "Unstitched";
            }
            else if (item.GenderCategory == "Women")
            {
                // Women: Use the SuitType and MetersPerSuit provided by frontend
                if (item.SuitType == "Stitched")
                {
                    item.MetersPerSuit = 0; // Not applicable for stitched
                }
            }
            var existingItem = await _context.Items
                .FirstOrDefaultAsync(i => i.Name.Trim().ToLower() == item.Name.Trim().ToLower()
                && i.PurchaseRate== item.PurchaseRate );

            if (existingItem != null)
            {
                // If it already exists, just add the new quantity to the existing one
                existingItem.Quantity += item.Quantity;
                existingItem.RemainingQuantity += item.Quantity;
                // You can optionally update the PurchaseRate to the newest rate
                // existingItem.PurchaseRate = item.PurchaseRate;
                await _context.SaveChangesAsync();
                return Ok(existingItem);
            }
            else
            {
                item.RemainingQuantity = item.Quantity; // Initially remaining = total
                item.DateAdded = DateTime.UtcNow;
                _context.Items.Add(item);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutItem(int id, Item item)
        {
            if (id != item.Id) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return NotFound();
            _context.Items.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Get items filtered by gender
    [HttpGet("by-gender/{gender}")]
     public async Task<ActionResult<IEnumerable<Item>>> GetItemByGender(string gender)
        {
            return await _context.Items.
            Where(x=>x.GenderCategory==gender)
            .OrderByDescending(x=>x.Id)
            .ToListAsync();
        }
        // Get stock summary by gender
       [HttpGet("stock-summary")]
        public async Task<ActionResult> GetSummary()
        {
            var menItems= await _context.Items.Where(x=>x.GenderCategory=="Men").ToListAsync();
            var womenItems= await _context.Items.Where(x=>x.GenderCategory=="Women").ToListAsync();
            var menStockMeter=menItems.Sum(x=>x.RemainingQuantity);
            var womenStockMeter= womenItems.Where(x=>x.SuitType=="UnStitched").Sum(x=>x.RemainingQuantity);
            var womwnStockPieces=womenItems.Where(x=>x.SuitType=="Stitched").Sum(x=>x.RemainingQuantity);
            //calculating men available suit
            var menAvailableSuit= menItems.Sum(x=>x.MetersPerSuit>0?Math.Floor(x.RemainingQuantity/x.MetersPerSuit):0);
            // Calculate available suits for women (unstitched only)
            var womenAvailableSuit=womenItems.Where(x=>x.SuitType=="UnStitched" && x.MetersPerSuit>0)
                                       .Sum(x=>Math.Floor(x.RemainingQuantity/x.MetersPerSuit));

            return Ok(new
            {
                men=new
                {
                    totalMeter=menStockMeter,
                    availableSuit=menAvailableSuit,
                    itemCount=menItems.Count
                },
                women=new
                {
                    unstitched=new
                    {
                        totalMeter=womenStockMeter,
                        availableSuit=womenAvailableSuit
                    },
                    stitched = new
                    {
                        totalPieces=womwnStockPieces
                    },itemCount=womenItems.Count

                }
            });
        }
    }
}

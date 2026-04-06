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
                item.MetersPerSuit=item.ClothType.ToLower().Contains("cotton")?4.5m:4m;
                item.SuitType="Unstiched";
            }
            else if (item.GenderCategory == "Female")
            {
                item.MetersPerSuit=0;
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
    }
}

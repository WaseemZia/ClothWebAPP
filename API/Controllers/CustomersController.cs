using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController :ControllerBase
    {
        private readonly AppDbContext _context;
        public CustomersController(AppDbContext context)
        { 
          _context=context;  
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomer()
        {
            var customer=await _context.Customers.
            Include(x=>x.Sales)
            .Include(x=>x.Loans)
            .OrderByDescending(x=>x.Id)
            .ToListAsync();
            // Calculate balance for each customer
            var result = customer.Select(x=>new
            {
             x.Id,
             x.Name,
             x.Address,
             x.Phone,
             x.CreatedDate ,
             TotalPurchase=x.Sales?.Sum(x=>x.TotalSalesAmount)??0,
             TotalLoanBalance=x.Loans?.Where(x=>x.Status=="Active")
             .Sum(x=>x.RemainingBalance) ??0 
            });
            return Ok(result);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult> GetCustomers(int id)
        {
            var customer= await _context.Customers
            .Include(x=>x.Sales)
            .ThenInclude(i=>i.Item)
            .Include(x=>x.Loans)
            .ThenInclude(p=>p.Payments)
            .FirstOrDefaultAsync(x=>x.Id==id);
            if(customer==null)
            {return NotFound("Customer Not Found");}
                        return Ok(customer);
        }
        [HttpPost]
        public async Task<ActionResult<Customer>> CreateCustomer(Customer customer)
        {
            customer.CreatedDate=DateTime.UtcNow;
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCustomer),new {id=customer.Id},customer);
        }
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateCustomer(int id, Customer customer)
        {
            if(id!=customer.Id)
            {
                return BadRequest();
            }
            var existingCustomer=await _context.Customers.FindAsync(id);
            if(existingCustomer==null)
            {
                return NotFound("Customer Not Found");
            }
            existingCustomer.Name=customer.Name;
            existingCustomer.Address=customer.Address;
            existingCustomer.Phone=customer.Phone;
            await _context.SaveChangesAsync();
            return NoContent();
        }
     [HttpDelete("{id}")]
     public async Task<ActionResult> DeleteCustomer(int id)
        {
            var existingCustomer=await _context.Customers
            .Include(s=>s.Sales)
            .Include(l=>l.Loans).
            FirstOrDefaultAsync(x=>x.Id==id);
            if(existingCustomer==null)
            {
            return NotFound("Customer Not Found");
            }
            var hasActiveLoans=existingCustomer.Loans?.Any(I=>I.Status=="Active")??false;
            if(hasActiveLoans){return BadRequest("You can not delete customer");}
            _context.Customers.Remove(existingCustomer);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet("search")]
        public async Task<ActionResult> SearchCustomer(string ? name,string phone)
        {
            var query= _context.Customers.AsQueryable();
            if(!string.IsNullOrEmpty(phone))
            {
                query=query.Where(c=>c.Phone.Contains(phone));
            }
            if (!string.IsNullOrEmpty(name))
            {
                query=query.Where(p=>p.Name.Contains(name));
            }
            var customer=await _context.Customers.Take(10).ToListAsync();
            return Ok(customer);
        }
    }
}
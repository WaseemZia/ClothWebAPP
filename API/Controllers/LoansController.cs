using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using API.Data;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    
    [Route("api/[controller]")]
    [ApiController]
    public class LoansController:ControllerBase
    {
     private readonly AppDbContext _context;
        public LoansController(AppDbContext context)
        { 
          _context=context;  
        }  
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Loan>>> GetLoans(string? Status=null)
        {
            var query = _context.Loans
            .Include(x=>x.Customer)
            .Include(x=>x.Payments)
            .Include(x=>x.Sale)
            .AsQueryable();
            if(!string.IsNullOrEmpty(Status))
            {
                query=query.Where(x=>x.Status==Status);
            }
            var loan =await query.OrderByDescending(x=>x.LoanDate).ToListAsync();
            return Ok(loan);
        }  
        //get loan details
        [HttpGet("{id}")]
        public async Task<ActionResult<Loan>> GetLoans(int id)
        {
            var loan = await _context.Loans
            .Include(x=>x.Customer)
            .Include(x=>x.Sale)
            .Include(x=>x.Payments)
            .FirstOrDefaultAsync(x=>x.Id==id);
            if (loan == null)
                return NotFound("Loan not found");

            return Ok(loan);
        }
      // Get customer's loans
       [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<Loan>>> GetCustomerLoans(int customerId)
        {
            var customer=await _context.Loans
            .Include(x=>x.Sale)
            .Include(x=>x.Payments)
            .Where(x=>x.CustomerId==customerId)
            .OrderByDescending(i=>i.LoanDate)
            .ToListAsync();
            return Ok(customer);
        }
        // POST: api/loans
        [HttpPost]
        public async Task<ActionResult<Loan>> CreateLoan(Loan loan)
        {
            loan.LoanDate = DateTime.UtcNow;
            loan.Status = "Active";
            
            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLoans), new { id = loan.Id }, loan);
        }
        [HttpPost("{id}/payment")]
        public async Task<IActionResult> RecordPayment(int id, LoanPayment payment)
        {
            var loan = await _context.Loans
            .Include(x=>x.Payments)
            .FirstOrDefaultAsync(x=>x.Id==id);
            if (loan == null)
            {
                return BadRequest("loan can not be found");
            }
            if(loan.Status=="Cleared")
            {
                return BadRequest("Loan has been cleared");
            }
            if(loan.AmountPaid>=0)
            {
                return BadRequest("Payment amount must be greater than 0");
            }
            else if(loan.AmountPaid<loan.RemainingBalance)
            {
                return BadRequest($"Payment amount cannot exceed remaining balance ({loan.RemainingBalance})");
            }
            payment.LoanId=id;
            payment.PaymentDate=DateTime.UtcNow;
            _context.LoanPayments.Add(payment);

            // update balance
            loan.AmountPaid+=payment.Amount;
            loan.RemainingBalance-=payment.Amount;
            if(loan.RemainingBalance<=0)
            {
                     loan.Status = "Cleared";
                loan.RemainingBalance = 0;
            }
       await _context.SaveChangesAsync();
       return Ok(new
       {
             message = loan.Status == "Cleared" ? "Loan cleared successfully!" : "Payment recorded successfully",
                remainingBalance = loan.RemainingBalance,
                status = loan.Status
       });
        }
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCustomer(int id)
        {
            var loan=await _context.Loans
            .Include(x=>x.Payments)
            .FirstOrDefaultAsync(x=>x.Id==id);
            if(loan== null)
            {
             return NotFound("Loan not found");
            }
            if(loan.Payments?.Count()>0)
            {
            return BadRequest("Cannot delete loan with existing payments");

            }
             _context.Loans.Remove(loan);
             await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpGet("summary")]
        public async Task<ActionResult> GetSummary()
        {
            var activeLoan = await _context.Loans
            .Where(i=>i.Status=="Active").
            ToListAsync();
            var clearedLoans= await _context.Loans
            .Where(x=>x.Status=="Cleared")
            .ToListAsync();
            return Ok(new
            {
                activeLoanCount=activeLoan.Count,
                totalActiveAmount=activeLoan.Sum(x=>x.RemainingBalance),
                totalClearedAmount=clearedLoans.Sum(x=>x.TotalAmount),
                overdueCount = activeLoan.Count(l => l.DueDate.HasValue && l.DueDate.Value < DateTime.UtcNow)

            });
        }

    }
}
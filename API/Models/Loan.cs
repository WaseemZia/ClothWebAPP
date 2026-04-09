using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace API.Models
{
    public class Loan
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public decimal TotalAmount { get; set; }
        [Required]
        public decimal AmountPaid { get; set; }
        [Required]
        public decimal RemainingBalance { get; set; }
        public string Status { get; set; } = "Active"; // Active, Cleared
        public DateTime LoanDate { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }
        [Required]
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        [Required]
        public int SaleId { get; set; }
        public Sale? Sale { get; set; }
        // Navigation property
        public ICollection<LoanPayment>? Payments { get; set; }
        
    }
}
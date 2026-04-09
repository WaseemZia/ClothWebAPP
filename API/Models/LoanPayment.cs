using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace API.Models
{
    public class LoanPayment
    {
        [Key]
        public int Id { get; set; }
       [Required]
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
        [Required]
        public int LoanId { get; set; }
        public Loan? Loan { get; set; }

    }
}
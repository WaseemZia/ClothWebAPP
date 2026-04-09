using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace API.Models
{
    public class Customer
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Phone { get; set; } = string.Empty;
        
        public string? Address { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // navigation property
        public ICollection<Sale> Sales{get;set;}=new List<Sale>();
        public ICollection<Loan> Loans{get;set;}=new List<Loan>();
    }
}
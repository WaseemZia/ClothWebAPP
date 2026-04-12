using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace API.Models
{
    public class SaleReturns
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int QuantityReturn{get;set;}
        [Required]
        public decimal RefundAmount{get;set;}
        public string Reasons{get;set;}=string.Empty;
        public DateTime ReturnDate{get;set;}= DateTime.UtcNow;
        //Navigation Properties 
        [Required]
        public int SaleId{get;set;}
        public Sale? Sale{get;set;}
        [Required]
        public int ItemId{get;set;}
        public Item? Item{get;set;}
    }
}
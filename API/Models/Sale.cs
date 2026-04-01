using System;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Sale
    {
        [Key]
        public int Id { get; set; }
        public int ItemId { get; set; }
        public Item? Item { get; set; }
        public int QuantitySold { get; set; }
        public decimal SoldRate { get; set; }
        public decimal TotalSalesAmount { get; set; }
        public DateTime SaleDate { get; set; } = DateTime.UtcNow;
    }
}

using System;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Item
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal PurchaseRate { get; set; }
        public string DealerName { get; set; } = string.Empty;
        public string GenderCategory { get; set; } = string.Empty;
        public decimal RemainingQuantity { get; set; }

       public string ClothType { get; set; } = "Wash & Wear"; 

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
    }
}

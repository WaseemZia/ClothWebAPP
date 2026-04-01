using System;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Expense
    {
        [Key]
        public int Id { get; set; }
        public string PersonName { get; set; } = string.Empty;
        public string ExpenseType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}

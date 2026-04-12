using API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }


        public DbSet<Item> Items { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        //  public DbSet<User> Users { get; set; }
       public DbSet<Customer> Customers { get; set; }
       public DbSet<Loan> Loans { get; set; }
       public DbSet<LoanPayment> LoanPayments { get; set; }
        public DbSet<SaleReturns> SaleReturns{get;set;}

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Disable cascade deletes on SaleId
            builder.Entity<SaleReturns>()
                .HasOne(sr => sr.Sale)
                .WithMany(s => s.SalesReturn)
                .HasForeignKey(sr => sr.SaleId)
                .OnDelete(DeleteBehavior.NoAction); 
                
            // Disable cascade deletes on ItemIdc
            builder.Entity<SaleReturns>()
                .HasOne(sr => sr.Item)
                .WithMany()
                .HasForeignKey(sr => sr.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}


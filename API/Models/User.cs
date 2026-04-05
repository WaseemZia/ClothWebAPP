using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Models
{
    public class User
    {
    public int Id { get; set; }
    public string UserName { get; set; }=string.Empty;

     public string Password { get; set; }=string.Empty;
     public string Role{get;set;}="Cashier";

    }
}
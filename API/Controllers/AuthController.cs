using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API.Data;
using API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Microsoft.IdentityModel.Tokens;

namespace API.Controllers
{
    
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController :ControllerBase
    {
        //  private readonly AppDbContext _context;
         private readonly UserManager<IdentityUser> _userManager;
         private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        public AuthController(AppDbContext context,UserManager<IdentityUser> userManager,
        RoleManager<IdentityRole> roleManager,
         IConfiguration configuration)
        {
            _userManager=userManager;
            _roleManager=roleManager;
            // _context = context;
            _configuration = configuration;            
        }
         [HttpPost("register")]
         public async Task<ActionResult> Register([FromBody] RegisterModel registerModel)
        {
            // create Role if not exist in DB
                var roleExists = await _roleManager.RoleExistsAsync(registerModel.Role);
            if (!roleExists)
            {
                await _roleManager.CreateAsync(new IdentityRole(registerModel.Role));
            }
            // set up new User
            var user = new IdentityUser { UserName = registerModel.Username };
            var result= await _userManager.CreateAsync(user,registerModel.Password);
            if(!result.Succeeded) return BadRequest(result.Errors);
            //assign to role
            await _userManager.AddToRoleAsync(user,registerModel.Role);
             return Ok(new { Message = "User created successfully!" });
        }
           // 2. LOGIN: Checks password securely and gives them a JWT Token
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            // verify user 
            var user =await _userManager.FindByNameAsync(model.Username);
            if(user==null || !await _userManager.CheckPasswordAsync(user,model.Password))
            {
                return Unauthorized("Invalid UserName or Password");
            }
            //assign Role
            var userRole = await _userManager.GetRolesAsync(user);
            // Stamp token with userName and Role 
            var authClaim= new List<Claim>
            {
                new Claim(ClaimTypes.Name,model.Username)
                ,new Claim(ClaimTypes.NameIdentifier,user.Id)
            };
            foreach(var role in userRole)
            {
                authClaim.Add(new Claim(ClaimTypes.Role,role));
            }
            // Encrypt and Generate the Token
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Issuer"], 
                expires: DateTime.Now.AddDays(7), // Keeps them logged in for 7 days
                claims: authClaim,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
  return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                role = userRole.FirstOrDefault() ?? "Cashier"
            });        }
    }
}
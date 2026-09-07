# Visitor Desk — myvisitor.co.in

Personal visitor management site by **John Selwyn**.  
**Domain:** https://myvisitor.co.in  

No company website links.

## Local preview

```bash
cd visitor-management-site
python3 -m http.server 5174
```

Visit http://localhost:5174

## Deploy to myvisitor.co.in

1. Vercel → New Project → root directory `visitor-management-site`
2. Add domain **myvisitor.co.in** (and `www` if you use it)
3. In GoDaddy DNS for `myvisitor.co.in`, point to Vercel (A / CNAME as Vercel shows)

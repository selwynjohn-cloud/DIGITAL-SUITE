# eGate — egate.co.in

Personal gate & visitor management site by **John Selwyn**.  
**Primary domain:** https://egate.co.in  
**Alias:** https://myvisitor.co.in  

No company website links.

## Local preview

```bash
cd visitor-management-site
python3 -m http.server 5174
```

Visit http://localhost:5174

## Deploy to egate.co.in

1. Vercel → New Project → root directory `visitor-management-site`
2. Add domain **egate.co.in** (and `www` if you use it)
3. Optionally add **myvisitor.co.in** as an alias on the same project
4. In GoDaddy DNS for each domain, point to Vercel (A / CNAME as Vercel shows)

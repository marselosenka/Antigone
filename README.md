# FUSEKI INSTALLATION
- Install Fuseki from their website ( https://jena.apache.org/download/index.cgi )
- Ideally `apache-jena-fuseki-6.0.0`
- Inside fuseki folder, after the installation, there is a bat file, start it `./fuseki-server.bat`


# LOAD TRIPLETS TO FUSEKI

- `cd C:\University\CS561\antigone-webapp`
- Run the following command: 
Get-ChildItem -Path .\Antigone-Layout -Recurse -Filter *.ttl | ForEach-Object {
  Invoke-RestMethod `
    -Uri "http://localhost:3030/antigone/data" `
    -Method Post `
    -ContentType "text/turtle" `
    -InFile $_.FullName
}

# START WEBAPP
- `python3 -m http.server 8000`

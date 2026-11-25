import asyncio, pathlib
from playwright.async_api import async_playwright
base = pathlib.Path(__file__).resolve().parent
out = base.parent / "screenshots"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width":1280,"height":800}, device_scale_factor=1, color_scheme="light", locale="fr-FR")
        await pg.goto((base/"harness.html").as_uri()); await pg.wait_for_timeout(500)
        async def shot(name, js):
            await pg.evaluate(js); await pg.wait_for_timeout(300)
            await pg.screenshot(path=str(out/name))
        await shot("1-accueil.png", "app.go('accueil')")
        await shot("2-courrier.png", "app.go('courrier')")
        await shot("3-message.png", """app.state.msg={m:DEMO.courrier.messages[0], detail:{head:{Emetteur:'Division des personnels enseignants','Récepteur(s)':'Liste de diffusion'}, corps:'Bonjour,\\n\\nLe mouvement national à gestion déconcentrée pour la rentrée 2027 est ouvert.\\n\\nVous trouverez en pièce jointe la note de service et le calendrier des opérations. La saisie des vœux se fait sur SIAM.\\n\\nCordialement,\\nLe service de gestion', pjs:[{nom:'note_de_service_mouvement_2027.pdf',taille:'412 Ko',url:'#'},{nom:'calendrier_operations.pdf',taille:'96 Ko',url:'#'}]}}; app.render()""")
        await shot("4-parcours.png", "app.state.msg=null; app.go('parcours')")
        await shot("5-services.png", "app.go('services')")
        await b.close()
asyncio.run(main())

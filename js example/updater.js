const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

const remoteVersionUrl = 'https://raw.githubusercontent.com/WaWeNoel/test1/main/version.json';
const localVersionFilePath = path.join(__dirname, 'version.txt');
const localAppContentPath = path.join(__dirname, 'main.js');
const localHtmlFilePath = path.join(__dirname, 'index.html');
const localAppPath = __filename;
const mainJsPath = path.join(__dirname, 'main.js');

async function checkAndUpdate() {
  try {
    // Lekérjük a távoli verziót és a letöltendő fájl linkjét a JSON-ből
    const remoteInfoResponse = await axios.get(remoteVersionUrl);
    const { version: remoteVersion, downloadUrl, htmlUrl } = remoteInfoResponse.data;

    // Olvassuk be a lokális verziót
    let localVersion = '0.0.0';
    if (fs.existsSync(localVersionFilePath)) {
      localVersion = fs.readFileSync(localVersionFilePath, 'utf-8').trim();
    }

    // Ha a távoli verzió nagyobb, akkor frissítünk
    if (compareVersions(remoteVersion, localVersion) > 0) {
      console.log(`1: Frissítés elérhető: ${localVersion} -> ${remoteVersion}`);

      // Letöltjük az új fájlt
      const downloadResponse = await axios.get(downloadUrl);
      const newContent = downloadResponse.data;

      // Frissítjük a ma.js fájlt a letöltött tartalommal
      fs.writeFileSync(localAppContentPath, newContent);

      // Letöltjük az új HTML-t
      const htmlResponse = await axios.get(htmlUrl);
      const newHtmlContent = htmlResponse.data;

      // Frissítjük az index.html fájlt az új verzió adataival
      fs.writeFileSync(localHtmlFilePath, newHtmlContent);

      // Frissítjük a version.txt fájlt az új verzióval
      fs.writeFileSync(localVersionFilePath, remoteVersion);

      console.log('1: Frissítés telepítve. Az alkalmazás újraindul.');

      // Indítunk egy időzítőt, és ha 5 másodpercig nincs újabb verzió, akkor bezárjuk az updater.js-t
      const timer = setTimeout(() => {
        console.log('2: Nincs újabb verzió. Az updater.js bezárul.');
        process.exit(); // Kilépés az updater.js-ből
      }, 5000);

      // Ellenőrizze és frissítse az alkalmazást újra 5 másodpercenként
      const checkInterval = 5000;
      const checkTimer = setInterval(async () => {
        const newRemoteInfoResponse = await axios.get(remoteVersionUrl);
        const { version: newRemoteVersion } = newRemoteInfoResponse.data;

        if (compareVersions(newRemoteVersion, remoteVersion) > 0) {
          // Van újabb verzió, töröljük az időzítőt és újraindítjuk az ellenőrzést
          clearTimeout(timer);
          clearInterval(checkTimer);
          checkAndUpdate();
        } else {
          // Nincs újabb verzió, bezárjuk az updater.js-t
          console.log('2: Nincs újabb verzió. Az updater.js bezárul.');
          process.exit(); // Kilépés az updater.js-ből
        }
      }, checkInterval);

      // Az updater.js újraindítása 5 másodperc múlva
      setTimeout(() => {
        console.log('2: Az updater.js újraindul.');
        exec(`node ${mainJsPath}`, (error) => {
          if (error) {
            console.error(`Hiba az updater.js újraindítása során: ${error}`);
            process.exit(); // Kilépés az updater.js-ből
          }
        });
      }, 5000);
    } else {
      console.log('2: Az alkalmazás naprakész. Az updater.js bezárul.');
      process.exit(); // Kilépés az updater.js-ből
    }
  } catch (error) {
    console.error(`Hiba történt: ${error.message}`);
  }
}

function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}

// Az updater.js indulásakor ellenőrizze és frissítse az alkalmazást
checkAndUpdate();

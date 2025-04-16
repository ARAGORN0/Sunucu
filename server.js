const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

const dataFilePath = path.join(__dirname, 'veriler.json');

async function ensureDataFileExists() {
    try {
        await fs.access(dataFilePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(dataFilePath, JSON.stringify([]), 'utf8');
        } else {
            console.error('Dosya kontrol hatası:', error);
            process.exit(1);
        }
    }
}

ensureDataFileExists();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.post('/kaydet', async (req, res) => {
    const { adSoyad, not } = req.body;

    try {
        const mevcutVeriler = JSON.parse(await fs.readFile(dataFilePath, 'utf8'));
        const mevcutBasvuru = mevcutVeriler.find(basvuru => basvuru.adSoyad === adSoyad);

        if (mevcutBasvuru) {
            if (mevcutBasvuru.durum === 'reddedilen') {
                res.json({ durum: 'hata', mesaj: 'Üzgünüm, seni tanımıyorum.' });
            } else if (mevcutBasvuru.durum === 'onaylanan') {
                res.json({ durum: 'onaylandi', mesaj: '5524761443' });
            } else {
                mevcutBasvuru.tekrarDenemeSayisi = (mevcutBasvuru.tekrarDenemeSayisi || 0) + 1;
                await fs.writeFile(dataFilePath, JSON.stringify(mevcutVeriler, null, 2), 'utf8');
                res.json({ durum: 'onaylandi', mesaj: 'Adınız alındı, lütfen onaylanmasını bekleyiniz. 1 hafta kadar sürebilir.' });
            }
        } else {
            const yeniVeri = { adSoyad, not, durum: 'bekleyen', tekrarDenemeSayisi: 0 };
            mevcutVeriler.push(yeniVeri);
            await fs.writeFile(dataFilePath, JSON.stringify(mevcutVeriler, null, 2), 'utf8');
            res.json({ durum: 'onaylandi', mesaj: 'Adınız alındı, lütfen onaylanmasını bekleyiniz.' });
        }
    } catch (hata) {
        console.error('Veri kaydetme hatası:', hata);
        res.status(500).json({ durum: 'hata', mesaj: 'Bir hata oluştu.' });
    }
});

app.get('/verileri-getir', async (req, res) => {
    try {
        const veriler = JSON.parse(await fs.readFile(dataFilePath, 'utf8'));
        res.json(veriler);
    } catch (hata) {
        console.error('Veri okuma hatası:', hata);
        res.status(500).json({ durum: 'hata', mesaj: 'Bir hata oluştu.' });
    }
});

app.post('/kaydet/guncelle', async (req, res) => {
    const updatedData = req.body;
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), 'utf8');
        res.json({ durum: 'onaylandi', mesaj: 'Veriler başarıyla güncellendi.' });
    } catch (error) {
        console.error('Veri güncelleme hatası:', error);
        res.status(500).json({ durum: 'uyari', mesaj: 'Veriler güncellenirken bir hata oluştu.' });
    }
});

app.listen(port, () => {
    console.log('Sunucu 3000 portunda çalışıyor.');
});

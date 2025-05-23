const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    const hostname = new URL(url).hostname;
    let content = '';

    if (hostname.includes('israelhayom.co.il')) {
      content = await page.$$eval('script[type="application/ld+json"]', scripts => {
        for (const s of scripts) {
          try {
            const json = JSON.parse(s.innerText);
            if (json.articleBody) return json.articleBody;
          } catch {}
        }
        return '';
      });
    } else if (hostname.includes('globes.co.il')) {
      content = await page.$$eval('div.article-body p', els => els.map(el => el.innerText).join('\n'));
    } else if (hostname.includes('bizportal.co.il')) {
      content = await page.$$eval('div.article-content p', els => els.map(el => el.innerText).join('\n'));
    } else if (hostname.includes('maariv.co.il')) {
      content = await page.$$eval('div.article-content p', els => els.map(el => el.innerText).join('\n'));
    } else {
      content = await page.$$eval('p', els => els.map(el => el.innerText).join('\n'));
    }

    await browser.close();
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server ready at http://localhost:${PORT}`));

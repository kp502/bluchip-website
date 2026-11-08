# Blu Chip Compliance – website

A 9-page website in the Blu Chip look (slate navy / light blue / Montserrat) with:
- **Request a Quote** form (`/request-quote.html`) – for new enquiries
- **Appointment form** (`/appointment.html`) – the online version of the schedule attached to the fee quote letter (in the main menu – you can also send a pre-filled link with each quote: `/appointment.html?ref=BLUCHIPQ/2026/00117&fee=£4,400+VAT`)
- Info pages: Home, Building Control, RBCAs, Building Regs, How It Works & FAQs, Contact, Privacy, Cookies

Each submission is emailed **as an Excel file** (sheet 1 = formatted record, sheet 2 = one data row for a master log), with any uploaded drawings attached, to the addresses you set. The submitter gets an automatic "received" email.

## Run it
```
npm install          # first time only
cp .env.example .env # then fill in recipients + SMTP details
npm start            # builds pages and starts http://localhost:3000
```
## Recipients
In `.env`: `MAIL_TO_QUOTES` and `MAIL_TO_APPOINTMENTS` (comma-separated). `MAIL_TO` is used for either if blank.
SMTP: Microsoft 365 (`smtp.office365.com`, 587) or Google Workspace (`smtp.gmail.com`, 587) – use an app password.

## Editing
- Page text: `src/pages/*.html` then `npm run build` (or just `npm start`). Don't edit `public/*.html` directly.
- Form questions: `forms/quote.js` and `forms/appointment.js` – one definition drives the web form, the validation and the Excel layout.
- Styling: `public/css/site.css`.

## Going live
It's a small Node app (needs Node 18+), so deploy to Render / Railway / Fly.io / a VPS, set the `.env` values as environment variables, and point `www.bc-compliance.co.uk` at it. The current site is on a hosted site-builder that can't run the forms' server code. Alternatively host the pages there and set `window.SITE_API` to the form server's URL.

## Before launch – checklist
- [ ] Read the Privacy Notice (draft) and add company number/registered office, ICO registration
- [ ] Confirm RBCA registration wording / BSR registration number and add it to the footer
- [ ] Confirm what you offer in Wales (see RBCA page FAQ)
- [ ] Check the information pages are accurate for your practice (they are general guidance)
- [ ] Send a real test submission of each form
# bluchip-website

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Maps / Geocoding

The admin bookings "Map" view (see `src/pages/AdminScheduler.jsx`) renders a Leaflet map and geocodes venue addresses server-side via the Netlify function `netlify/functions/geocode.js`.

- **Default geocoder:** OpenStreetMap Nominatim (free, but can be hit-or-miss for some local addresses)
- **Optional fallback:** Google Geocoding API (more reliable for many addresses)

To enable the Google fallback:

- Set `GOOGLE_MAPS_API_KEY` in your Netlify environment variables (or locally in `.env` for `netlify dev`).
- In Google Cloud Console, enable **Geocoding API** for the same project/key (billing is typically required).

No additional npm package is required for geocoding; it’s just an HTTPS call from the Netlify function.

## WhatsApp order/booking notifications

New orders and bookings can send a WhatsApp message to the manager via the Meta WhatsApp Cloud API.

Set these environment variables (Netlify or local `.env` for `netlify dev`):

- `WHATSAPP_ACCESS_TOKEN` (Cloud API token)
- `WHATSAPP_PHONE_NUMBER_ID` (Cloud API phone number ID)
- `WHATSAPP_MANAGER_PHONE` (manager phone number, any format)

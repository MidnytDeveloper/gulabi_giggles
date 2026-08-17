GULABI GIGGLES — WEBSITE UPDATE

What was added:
- Separate Collection page with a 3-column product grid and matching watermark theme.
- Product descriptions (30–50 words recommended) are displayed on the Collection page.
- Lightweight Product Manager at manage-products.html.
- Add new products.
- Add, replace and remove product images.
- Visually choose the default image for each product.
- Edit product names and descriptions.
- Existing product data is preserved as the built-in fallback.
- Product changes are stored in the browser using IndexedDB; this requires the manager and public pages to be opened from the same website origin.
- Updated the logo in the hero artwork to use the actual multicolour Gulabi Giggles logo artwork.

HOW TO USE THE PRODUCT MANAGER
1. Open manage-products.html.
2. For an existing product, edit its name/description and click Save Product.
3. Click Set Default under the photograph you want to use as the main/default image.
4. Use Replace or Remove under individual images, or Add Image to add another image.
5. Click + Add Product to create a new product. Select its first image, then add more images and a description.
6. Open the Collection page in the same browser to see the changes.

IMPORTANT
This version stores uploaded images and catalogue edits in the browser's IndexedDB. It does not upload files to your web server. For a shared production catalogue that works across devices, the same interface can later be connected to a backend/database or CMS without changing the customer-facing design.

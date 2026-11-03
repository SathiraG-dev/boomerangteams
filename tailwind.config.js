/** Boomerang Teams, Tailwind build config.
 * Source of truth for the design tokens previously duplicated inline across
 * every HTML page's CDN <script id="tailwind-config">. Edit here only. */
module.exports = {
  content: [
    "./index.html",
    "./case-studies.html",
    "./work/*.html",
    "./*.js"
  ],
darkMode: "class",
    theme: {
      extend: {
        colors: {
          "on-tertiary-container": "#d5e5e9",
          "on-secondary-fixed": "#001f28",
          "surface-bright": "#343b3e",
          "on-secondary": "#00272e",
          "surface-variant": "#3d494c",
          "tertiary-fixed-dim": "#b9c9cd",
          "on-tertiary": "#0e1e21",
          "primary-container": "#28abc9",
          "inverse-on-surface": "#0d1316",
          "background": "#0d1316",
          "surface-container-lowest": "#07090b",
          "error-container": "#93000a",
          "surface-container-low": "#13191c",
          "on-primary-fixed-variant": "#004e5e",
          "tertiary-container": "#3a494d",
          "secondary-fixed": "#b4ebff",
          "outline-variant": "#3d494c",
          "outline": "#869195",
          "on-primary-fixed": "#001f27",
          "on-tertiary-fixed": "#0e1e21",
          "surface": "#0d1316",
          "tertiary": "#b9c9cd",
          "surface-container-high": "#1f2629",
          "on-tertiary-fixed-variant": "#3a494d",
          "on-error-container": "#ffdad6",
          "surface-container-highest": "#2a3134",
          "on-secondary-container": "#a4e7fe",
          "on-error": "#690005",
          "surface-dim": "#07090b",
          "on-secondary-fixed-variant": "#004e5f",
          "primary-fixed-dim": "#61d5f4",
          "secondary-fixed-dim": "#8ed0e7",
          "primary": "#61d5f4",
          "on-primary": "#ffffff",
          "surface-tint": "#61d5f4",
          "error": "#ffb4ab",
          "secondary": "#8ed0e7",
          "secondary-container": "#0e5f73",
          "tertiary-fixed": "#d5e5e9",
          "primary-fixed": "#b0ecff",
          "on-surface": "#e7edf0",
          "on-primary-container": "#e7f9ff",
          "on-surface-variant": "#b7c2c5",
          "surface-container": "#171e21",
          "on-background": "#e7edf0",
          "inverse-primary": "#00687c",
          "inverse-surface": "#e7edf0"
        },
        borderRadius: {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
        },
        spacing: {
          "margin-lg": "4rem",
          "space-xs": "0.375rem",
          "margin": "1.25rem",
          "gutter": "1.5rem",
          "gutter-lg": "2.5rem",
          "space-md": "1.25rem",
          "space-lg": "2rem",
          "space-sm": "0.75rem",
          "margin-md": "2rem",
          "space-xl": "3.5rem"
        },
        fontFamily: {
          "display-lg": ["Inter"],
          "label-caps-lg": ["Inter"],
          "display-lg-mobile": ["Inter"],
          "label-text": ["Inter"],
          "label-caps-sm": ["Inter"],
          "headline-lg": ["Inter"],
          "display-xl": ["Roboto"],
          "body-md": ["Inter"],
          "body-lg": ["Inter"],
          "body-xl": ["Inter"],
          "headline-sm": ["Inter"],
          "headline-md": ["Inter"],
          "display-xl-mobile": ["Inter"],
          "section-head": ["Inter"]
        },
        fontSize: {
          "section-head": ["clamp(38px, 4.8vw, 68px)", {"lineHeight": "1.08", "letterSpacing": "-0.045em", "fontWeight": "700"}],
          "section-head-xl": ["clamp(44px, 5.6vw, 78px)", {"lineHeight": "1.06", "letterSpacing": "-0.045em", "fontWeight": "700"}],
          "display-lg": ["68px", {"lineHeight": "72px", "letterSpacing": "0.01em", "fontWeight": "400"}],
          "label-caps-lg": ["14px", {"lineHeight": "20px", "letterSpacing": "0.1em", "fontWeight": "700"}],
          "display-lg-mobile": ["42px", {"lineHeight": "46px", "letterSpacing": "0.01em", "fontWeight": "400"}],
          "label-text": ["16px", {"lineHeight": "22px", "fontWeight": "600"}],
          "label-caps-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.12em", "fontWeight": "700"}],
          "headline-lg": ["46px", {"lineHeight": "50px", "letterSpacing": "0.02em", "fontWeight": "700"}],
          "display-xl": ["96px", {"lineHeight": "96px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
          "body-md": ["16px", {"lineHeight": "26px", "fontWeight": "400"}],
          "body-lg": ["19px", {"lineHeight": "30px", "fontWeight": "400"}],
          "body-xl": ["21px", {"lineHeight": "34px", "fontWeight": "400"}],
          "headline-sm": ["25px", {"lineHeight": "30px", "letterSpacing": "0.03em", "fontWeight": "700"}],
          "headline-md": ["33px", {"lineHeight": "38px", "letterSpacing": "0.02em", "fontWeight": "700"}],
          "display-xl-mobile": ["56px", {"lineHeight": "58px", "letterSpacing": "0.02em", "fontWeight": "400"}]
        }
      }
    },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
};

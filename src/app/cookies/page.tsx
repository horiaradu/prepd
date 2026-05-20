"use client";

import * as CookieConsent from "vanilla-cookieconsent";

export default function CookiePolicy() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-4 text-sm text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:border-b [&_th]:border-gray-200 [&_th]:pb-2 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_td]:border-b [&_td]:border-gray-100 [&_a]:text-green-700 [&_a]:underline">
      <h1>Cookie Policy</h1>
      <p className="text-gray-500">Last updated: May 20, 2026</p>

      <p>
        This page explains what cookies Mintdish uses and why. You can change
        your preferences at any time using the button below.
      </p>

      <button
        onClick={() => CookieConsent.showPreferences()}
        className="inline-flex items-center rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
      >
        Manage cookie preferences
      </button>

      <h2>Necessary cookies</h2>
      <p>
        These cookies are required for the site to work. They cannot be
        disabled.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>next-auth.session-token</code>
            </td>
            <td>Keeps you signed in</td>
            <td>Session / 30 days</td>
          </tr>
          <tr>
            <td>
              <code>NEXT_LOCALE</code>
            </td>
            <td>Remembers your language preference</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>
              <code>cc_cookie</code>
            </td>
            <td>Stores your cookie consent preferences</td>
            <td>6 months</td>
          </tr>
        </tbody>
      </table>

      <h2>Analytics cookies</h2>
      <p>
        These cookies help us understand how people use Mintdish. They are only
        set if you accept analytics cookies.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Service</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>_ga</code>
            </td>
            <td>Google Analytics</td>
            <td>Distinguishes unique users</td>
            <td>2 years</td>
          </tr>
          <tr>
            <td>
              <code>_ga_*</code>
            </td>
            <td>Google Analytics</td>
            <td>Maintains session state</td>
            <td>2 years</td>
          </tr>
          <tr>
            <td>
              <code>_vercel_*</code>
            </td>
            <td>Vercel Analytics</td>
            <td>Anonymous usage and performance metrics</td>
            <td>Session</td>
          </tr>
        </tbody>
      </table>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:horia@mintdish.io">horia@mintdish.io</a>.
      </p>
    </div>
  );
}

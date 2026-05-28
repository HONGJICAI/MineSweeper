**Privacy Policy**

This privacy policy applies to the {{name}} app for mobile devices (the "Application") operated by {{controller_name}} (the "Service Provider").

**Information Collection and Use**

{{#if has_admob}}
When you use the Application, the following information may be collected automatically:

- Your device's Internet Protocol (IP) address
- Your device's Advertising Identifier (Android Advertising ID / AAID)
- Device information including model, manufacturer, operating system, and OS version
- Application usage data such as which screens you visit and how long you spend in the Application
- General region or country inferred from your IP address (no precise location is collected)

**Use of Information**

The information collected is used for:

- Serving advertisements through Google AdMob, including ad personalization (where lawful), frequency capping, and fraud prevention
- Diagnosing technical issues and improving the Application
- Aggregated analytics about how the Application is used
{{/if}}
{{#unless has_admob}}
The Application does **not** collect any personal information from users. It does not include any third-party advertising, analytics, or tracking SDKs, and does not transmit any user data off of your device.

The Application does **not** request location, contacts, calendar, photos, microphone, camera, or any other sensitive permissions.
{{/unless}}

**Local Data on Your Device**

The Application stores game progress, leaderboard times, and preferences locally on your device. This data is **not** transmitted to the Service Provider or to any third party. Uninstalling the Application removes all locally stored data.

{{#if has_admob}}
**Third-Party Services**

The Application uses Google AdMob to display advertisements. For each ad request, AdMob receives the following device-level information for ad serving, frequency capping, and fraud prevention:

- Your device's Advertising Identifier (AAID)
- IP address
- Device model, manufacturer, and operating system version
- Ad interaction events (impressions, clicks)

This data is transmitted to Google in identifiable form (it is not aggregated or anonymized at the point of transmission). Google AdMob handles this data in accordance with its own privacy practices. The Service Provider does **not** sell your personal data to any third party.

Links to the privacy policies of third-party services:

- [Google Play Services](https://www.google.com/policies/privacy/)
- [Google AdMob](https://policies.google.com/technologies/partner-sites)

You can reset your Advertising ID at any time through Android Settings → Privacy → Ads → Reset advertising ID, which will limit ad personalization.
{{/if}}

**International Data Transfers**

The Application is distributed exclusively outside {{excluded_regions_list}}. {{#if has_admob}}Personal data may be transferred to and processed in the United States by Google (AdMob) and other service providers. Where applicable law requires safeguards for international data transfers, the Service Provider will apply appropriate measures.{{/if}}{{#unless has_admob}}No personal data is transferred to any third party.{{/unless}}

**Your Rights**

You may request access to, correction of, or deletion of personal data held by the Service Provider. To exercise these rights, contact the Service Provider at {{contact_email}}.

**Your California Privacy Rights (CCPA/CPRA)**

If you are a California resident, you have the right to:

- Know what categories of personal information are collected about you
- Request deletion of personal information collected from you
- Opt out of the sale or sharing of personal information
- Non-discrimination for exercising any of these rights

The Service Provider does not sell personal information for monetary value. To exercise your CCPA/CPRA rights, contact the Service Provider at {{contact_email}}.

**Disclosure of Information**

The Service Provider may disclose information:

- As required by law, such as to comply with a subpoena or similar legal process
- When the Service Provider believes in good faith that disclosure is necessary to protect their rights, your safety or the safety of others, investigate fraud, or respond to a government request
{{#if has_admob}}
- With trusted service providers (e.g., Google AdMob) that work on the Service Provider's behalf under appropriate confidentiality terms
{{/if}}

**Opt-Out and Data Deletion**

{{#if has_admob}}
You can limit data collection in the following ways:

- **Reset Advertising ID**: Android Settings → Privacy → Ads → Reset advertising ID
- **Opt out of ad personalization**: Android Settings → Privacy → Ads → Opt out of Ads Personalization
- **Stop all data collection**: Uninstall the Application. Locally stored game data is removed. Information previously transmitted to AdMob is handled according to Google's retention policies.

To request deletion of any personal data the Service Provider may hold about you, contact {{contact_email}}.
{{/if}}
{{#unless has_admob}}
Because the Application does not collect or transmit any personal data, there is no data to opt out of. Uninstalling the Application removes all locally stored game data from your device.
{{/unless}}

**Data Retention**

- **Locally stored data** (game progress, leaderboard times): Retained on your device until you uninstall or clear application data.
{{#if has_admob}}
- **Automatically collected data transmitted to third parties** (AdMob): Retained by Google according to its own retention policies (typically up to 24 months).
- **Aggregated and anonymized data**: Retained indefinitely as it no longer identifies you.
{{/if}}
- **Data required for legal compliance**: Retained as long as required by applicable law.

The Service Provider itself does **not** maintain a server-side database of user-identifiable information. The Application has no account system, login, or user-submitted content.

**Children's Privacy**

The Application is not intended for children under 13 years of age, or such higher age as required by applicable law. The Service Provider does not knowingly collect personally identifiable information from children under 13.

If you are a parent or guardian and believe that a child has provided personal information through the Application, please contact {{contact_email}} and the Service Provider will take steps to delete such information.

**Security**

The Service Provider implements reasonable physical, electronic, and procedural safeguards to protect information processed and maintained. No method of transmission over the Internet or electronic storage is 100% secure, however, and absolute security cannot be guaranteed.

**Data Breach Notification**

If a data breach occurs that affects your personal data, the Service Provider will notify affected users in accordance with applicable legal requirements, including, where required, providing information about the nature of the breach and the steps being taken to address it.

**Cookies and Tracking Technologies**

The Application is a native mobile application and does not set or use HTTP cookies. {{#if has_admob}}Google AdMob's SDK may use device identifiers and similar technologies for the purposes described above under "Third-Party Services".{{/if}}{{#unless has_admob}}The Application contains no third-party tracking SDKs.{{/unless}}

**Changes to This Privacy Policy**

The Service Provider may update this Privacy Policy from time to time. Material changes will be posted with an updated effective date. Continued use of the Application after such changes constitutes acceptance of the updated policy.

This Privacy Policy is effective as of {{effective_date}}.

**Contact Us**

If you have any questions about this Privacy Policy or the Application's privacy practices, contact the Service Provider via email at {{contact_email}}.

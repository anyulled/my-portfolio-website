import { Playfair_Display } from "next/font/google";
import { Metadata } from "next";

const playfair = Playfair_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cookie Policy · Boudoir Photography in Barcelona",
};

export default function CookiePage() {
  return (
    <div
      className={`min-h-screen dark:from-zinc-900 dark:to-zinc-800 bg-gradient-to-b from-neutral-400 to-neutral-50 pt-20`}
    >
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1
          className={`${playfair.className} text-4xl md:text-5xl font-bold text-center mt-12 mb-8`}
        >
          Cookie Policy
        </h1>
        <div className="prose dark:prose-invert mx-auto">
          <p>
            We inform you that Sensuelle Boudoir WEBSITE uses
            &apos;cookies&apos; in order to allow and facilitate user
            interaction with it as well as the quality of the page according to
            the users&apos; browsing habits and styles. We also inform you that
            the statistics services -own or third-party-, used by Sensuelle
            Boudoir&apos;s WEBSITE may use &apos;cookies&apos; in order to
            establish metrics and patterns of use of the site. Access, use and,
            in general, navigation through Sensuelle Boudoir&apos;s WEBSITE
            necessarily imply the USER&apos;s consent to the use of
            &quot;cookies&quot; by Sensuelle Boudoir and/or its service
            providers.
          </p>

          <h2>What are cookies?</h2>
          <p>
            A cookie is a file that is downloaded to the USER&apos;s computer,
            Smartphone, or tablet when accessing certain web pages.
          </p>

          <p>
            Cookies allow the owner of the page or WEBSITE to store or retrieve
            certain information on multiple variables, such as; the number of
            times the page has been visited by the USER, guarantee the
            USER&apos;s session while browsing the website or SITE, the way in
            which they use their equipment, etc., all in order to be recognized
            as a USER. It should be noted that blocking all cookies may disable
            certain services and functionalities.
          </p>

          <h2>What types of cookies does this page or WEBSITE use?</h2>
          <p>
            <strong>Analysis cookies:</strong> These are those that, whether
            processed by Sensuelle Boudoir or by third parties, allow us to
            quantify the number of users and thus carry out the measurement and
            statistical analysis of the use that users make of the service
            offered. To do this, your navigation on our website is analyzed in
            order to improve the offer of products or services that we offer
            you.
          </p>

          <h2>How to disable or delete Cookies</h2>
          <p>
            You can allow, block or delete the cookies installed on your
            computer by configuring the options of the browser installed on your
            computer.
          </p>

          <p>
            The Help function of most browsers indicates how to configure your
            browser so that it does not accept cookies, so that it notifies you
            each time you receive a new cookie, as well as to completely disable
            all cookies.
          </p>

          <p>
            In general, we inform you that browsers offer the following
            configuration options in relation to the installation of cookies:
          </p>

          <p>
            The browser rejects all cookies and therefore, no cookies from any
            website are installed on your terminal. The browser warns you before
            the cookie is installed so that you can decide whether or not to
            accept the installation of the cookie. The browser only rejects
            third-party cookies from the websites you visit but not those used
            by the website you are browsing.
          </p>

          <p>
            In addition, you can disable or delete similar data used by browser
            extensions (add-ons), such as “Flash Cookies”, by changing the
            settings of said extensions or visiting the manufacturer&apos;s
            website.
          </p>

          <p>
            However, we inform you that during navigation on the Website,
            &quot;cookies&quot; are used, small data files that are generated on
            the Internet user&apos;s computer and that allow us to obtain the
            following analytical information:
          </p>

          <ul>
            <li>
              The date and time of access to the Website, allowing us to know
              the busiest hours, and make the necessary adjustments to avoid
              saturation problems during our peak hours.
            </li>

            <li>
              The number of daily visitors to each section, allowing us to know
              the most successful areas and increase and improve their content,
              so that users obtain a more satisfactory result and improve the
              design of the content.
            </li>

            <li>
              The date and time of the last time the user visited the Website to
              carry out analytical and statistical studies on the use of the
              website.
            </li>

            <li>
              Security elements that intervene in the control of access to
              restricted areas.
            </li>
          </ul>

          <p>For more information, visit our cookie policy.</p>

          <h2>User rights.</h2>
          <p>
            All users may exercise any of the rights granted by data protection
            regulations, such as the right of access, limitation of processing,
            deletion, portability, etc. by writing to Sensuelle Boudoir at the
            address XX XXX nº XX · 08000 Barcelona, or by sending an email to
            info@boudoir.barcelona proving their identity.
          </p>

          <p>
            Any user may object to the use of their information for advertising
            purposes, market research or the development of satisfaction
            surveys, as well as revoke their consent at any time (without
            retroactive effect). To do so, they must send an email to the
            address info@boudoir.barcelona When you receive information of
            interest by email, you can also unsubscribe from said email, by
            clicking on the link included in it and sending an email to the
            address info@boudoir.barcelona with the subject “Unsubscribe”.
          </p>

          <h2>Changes to the Privacy Policy.</h2>
          <p>
            Our Privacy Policy may be updated due to legal changes and needs, as
            well as due to improvements and changes included in the way we offer
            and provide our services and the features of the application.
            Therefore, we recommend that you visit and access our Privacy Policy
            periodically, in order to have access to and be aware of the latest
            changes that may have been incorporated. In the event that said
            changes are related to the consent given by the user, in such case a
            separate and independent notification will be sent to you to collect
            it again.
          </p>

          <p>
            If during the reading any doubt or question has arisen regarding our
            Privacy Policy or you want to exercise any right or action related
            to your personal data, please contact us at the following email
            address info@boudoir.barcelona
          </p>
        </div>
      </div>
    </div>
  );
}

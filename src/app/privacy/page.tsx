import { Playfair_Display } from "next/font/google";
import {Metadata} from "next";

const playfair = Playfair_Display({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Privacy Terms · Boudoir Photography in Barcelona",
};
export default function PrivacyPage() {
  return (
    <div
      className={`min-h-screen dark:from-zinc-900 dark:to-zinc-800 bg-gradient-to-b from-neutral-400 to-neutral-50 pt-20`}
    >
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1
          className={`${playfair.className} text-4xl md:text-5xl font-bold text-center mt-12 mb-8`}
        >
          Privacy Terms
        </h1>
        <div className="prose dark:prose-invert mx-auto">
          <p>
            The following information about our Privacy Policy reflects our
            commitment to maintaining and guaranteeing safe professional
            relationships by protecting personal data, guaranteeing the right to
            privacy of our clients. In this document we explain how we use the
            personal data of the users of the web portal.
          </p>

          <h2 className={`${playfair.className}`}>
            Definition of personal data
          </h2>
          <p>
            As &quot;Personal Data&quot; we must understand any information
            concerning an identified or identifiable natural person. Among
            others, this includes the name, surname, postal and electronic
            address, as well as the telephone number.
          </p>

          <p>
            Which entity is responsible for the processing of personal data? The
            personal data collected through the established channels will form
            part of the files and treatments of Sensuelle Boudoir with CIF
            number X123456, with registered office at XX XXX, 123, postal code
            08000 Barcelona.
          </p>

          <h2 className={`${playfair.className} `}>
            Processing and purposes of the data collected
          </h2>
          <p>
            Any personal data that you provide us when visiting any of our web
            portals will be treated in accordance with data protection
            regulations and will only be collected, processed and used for
            lawful, legitimate and informed purposes. Therefore, we detail all
            the purposes for which we use personal data as data controllers:
          </p>

          <ul>
            <li>
              Manage contact forms to respond to your requests for information,
              using web forms or via email or a phone call, and respond to the
              questions raised. Any user who completes or fills out a contact
              form will be automatically subscribed to our newsletter for the
              purposes described below.
            </li>

            <li>
              Manage subscription to the entity&apos;s newsletter where
              information about new courses, conferences, legal developments, in
              short, information of interest to the entity or the business world
              is periodically sent.
            </li>

            <li>
              Manage user registrations to be able to use certain sections of
              the website that are only reserved for those users who have
              acquired the status of registered user. In this case, you will
              also be automatically subscribed to our newsletter for the
              purposes described.
            </li>
          </ul>

          <p>
            In any case, all users are informed of the non-mandatory nature of
            the collection of certain personal data, except in the fields where
            otherwise indicated. However, failure to complete such data may
            prevent the provision of those Services that depend on the knowledge
            of such data, so we are released from all liability for the
            non-provision or incomplete provision of these Services.
          </p>

          <p>
            It is the user&apos;s obligation to provide the data truthfully and
            keep it updated. Consequently, we reserve the right to exclude from
            the services and proceed to cancel the service of any user who has
            provided false data, without prejudice to any other actions that may
            be appropriate under the Law.
          </p>

          <p>
            In addition, each user, at the time that they enter their personal
            data or interact with our web portal, must respect and comply with
            the other terms and uses published on the web portal in the legal
            notice section.
          </p>

          <h2 className={`${playfair.className} `}>
            Legitimacy for the processing of your data
          </h2>
          <p>
            The legal basis for the processing of your data is the response to
            queries raised through the website, which involves the application,
            at the request of the interested party, of pre-contractual measures
            by the interested party.
          </p>

          <h2 className={`${playfair.className} `}>Period of data retention</h2>
          <p>
            The data will be kept for the time necessary to respond to queries,
            provide the requested service and fulfill the indicated purposes.
            However, in the event that the user has requested to be included in
            the newsletter, their data will be kept until they unsubscribe
            through the procedure enabled for this purpose.
          </p>

          <h2 className={`${playfair.className} `}>
            Communication of your personal data to third parties
          </h2>
          <p>
            The personal data provided through the contact forms, or by simply
            subscribing to our newsletter will NOT be transferred to any third
            party.
          </p>

          <p>
            In the event that it is necessary to communicate your information to
            a third party, your consent will be requested.
          </p>

          <h2 className={`${playfair.className} `}>
            Security of your personal data
          </h2>
          <p>
            At Sensuelle Boudoir we have a special concern for guaranteeing the
            security of your personal data. Your data is stored in our
            information systems, where we have adopted and implemented technical
            and organizational security measures to prevent any loss or
            unauthorized use by third parties. For example, our web portals use
            Https data encryption protocols.
          </p>

          <h2 className={`${playfair.className} `}>
            Information on the Use of Cookies
          </h2>
          <p>
            The mere fact of visiting this web portal or using the services of
            our website does not imply that any personal data that identifies
            you is automatically recorded.
          </p>
        </div>
      </div>
    </div>
  );
}

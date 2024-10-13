import { css } from '@/styled-system/css'
import { Heading } from '@/components/ui/heading'
const Page = () => {
  return <div className={css({
    maxWidth: "960px",
    m: 10
  })}>
    <Heading as="h1" size="4xl" my={4}>Privacy Policy</Heading>

    <Heading as="h2" size="2xl" my={4}>Last Updated: 13/10/2024</Heading>

    <Heading as="h3" my={4}>No Collection of Personal Data</Heading>
    <p><strong>Street Rankings</strong> does not collect or store any personal information or personally identifiable information (PII). We do not require users to create accounts, and we do not track or collect data related to your identity, location, or usage behavior.</p>

    <Heading as="h3" my={4}>Photos and Content</Heading>
    <p>Any photos or content you upload using <strong>Street Rankings</strong> are stored locally on your device or shared publicly through the app’s features. We do not retain, monitor, or store any photos or content that you upload. All content is posted and shared at the user’s discretion.</p>

    <Heading as="h3" my={4}>Third-Party Services</Heading>
    <p><strong>Street Rankings</strong> does not integrate with any third-party services that collect or track user data. We do not share, sell, or distribute any user data, as we do not collect such data in the first place.</p>

    <Heading as="h3" my={4}>Children’s Privacy</Heading>
    <p>Our app is not directed at children under the age of 13, and we do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided personal information to us, please contact us at: <a href="mailto:jordanddisch@gmail.com">jordanddisch@gmail.com</a>, and we will take steps to delete any such information.</p>

    <Heading as="h3" my={4}>Changes to this Privacy Policy</Heading>
    <p>We may update this Privacy Policy from time to time. If we make any significant changes, we will notify users by updating the “Last Updated” date at the top of this policy. Your continued use of <strong>Street Rankings</strong> after any changes to this policy will constitute your acknowledgment and acceptance of those changes.</p>

    <Heading as="h3" my={4}>Contact Us</Heading>
    <p>If you have any questions or concerns about this Privacy Policy or how we handle your information, please contact us at: <a href="mailto:jordanddisch@gmail.com">jordanddisch@gmail.com</a>.</p>
  </div>
}

export default Page;
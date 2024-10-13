import React from 'react'
import { css } from '@/styled-system/css'
import { Heading } from '@/components/ui/heading'

const Page = () => {
  return (
    <div className={css({
      maxWidth: "960px",
      m: 10
    })}>
      <Heading as="h1" size="4xl" my={4}>Terms of Service</Heading>

      <Heading as="h2" size="2xl" my={4}>Welcome to Street Rankings</Heading>

      <Heading as="h3" my={4}>About Street Rankings</Heading>
      <p><strong>Street Rankings</strong> is a photo upload app designed for users to share and rank their favorite street photos. No account or personal information is required to use the app.</p>

      <Heading as="h3" my={4}>Features</Heading>
      <ul>
        <li>Upload street photos directly from your device.</li>
        <li>Rank photos based on quality and creativity.</li>
        <li>View top-ranked photos from around the world.</li>
      </ul>

      <Heading as="h3" my={4}>Content Guidelines</Heading>
      <p>When using Street Rankings, please follow these guidelines:</p>
      <ol>
        <li>Do not upload illegal or harmful content.</li>
        <li>Ensure that you own the rights to the photos you upload.</li>
        <li>Respect other users and their content.</li>
      </ol>

      <Heading as="h3" my={4}>Contact Us</Heading>
      <p>If you have any questions, feel free to contact us at: <a href="mailto:jordanddisch@gmail.com">jordanddisch@gmail.com</a></p>

      <blockquote>&quot;Capture the essence of the street – one photo at a time.&quot;</blockquote>

      <Heading as="h3" my={4}>Get Started Today</Heading>
      <p><em>Join the community of street photographers, and start sharing your unique perspective with the world!</em></p>
    </div>
  )
}

export default Page;
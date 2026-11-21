import { useEffect, useState } from 'react';
import { latestResetEmail } from '../demo/mockApi.js';
import '../demo/demo.css';

// Demo mode only: shows the e-mail the real app would send, with a working reset link.
export default function DemoInbox({ identifier }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let alive = true;
    latestResetEmail(identifier).then((r) => alive && setInfo(r));
    return () => { alive = false; };
  }, [identifier]);

  if (!info) return null;
  const { matched, hasEmail, mail } = info;

  return (
    <section className="demo-inbox" aria-label="Simulated e-mail inbox">
      <p className="eyebrow">Simulated inbox (demo)</p>
      {mail ? (
        <article className="demo-mail">
          <p className="muted demo-mail-meta">To: {mail.to}<br />Subject: Reset your StudentHub password</p>
          <p>Hi {mail.username},</p>
          <p>We received a request to reset your password. The link below works once and expires in 30 minutes.</p>
          <a className="btn primary" href={`#/reset-password/${mail.token}`}>Reset my password</a>
          <p className="muted demo-mail-foot">If you did not ask for this, ignore this e-mail.</p>
        </article>
      ) : (
        <p className="muted">
          {matched && !hasEmail
            ? 'That account has no e-mail address, so no link was sent. Create an account with an e-mail to try this.'
            : 'No account matches that name or e-mail, so nothing was sent. (The real app shows the same message either way.)'}
        </p>
      )}
      <p className="muted demo-mail-foot">Real e-mails are not sent from this demo.</p>
    </section>
  );
}

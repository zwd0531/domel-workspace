import Image from "next/image";

export function AuthStory() {
  return (
    <section className="login-story">
      <Image className="login-brand-logo" src="/domel-logo.svg" alt="Domel" width={346} height={116} priority />
      <span className="eyebrow">DOMEL SUZHOU · EMPLOYEE WORKSPACE</span>
      <h1>One workspace.<br />Three employee views.</h1>
      <p className="lead">Explore the same household vacuum product records through the information each role needs.</p>
      <LoginFeature number="01" title="Sales Coordinator" description="Orders, prices and customer shipments" />
      <LoginFeature number="02" title="Production Planner" description="Plans, output and delivery performance" />
      <LoginFeature number="03" title="Quality Engineer" description="Testing, defects and product risks" />
    </section>
  );
}

function LoginFeature({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="login-feature"><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div></div>;
}

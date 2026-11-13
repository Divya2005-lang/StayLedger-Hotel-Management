import Scene from './Scene.jsx';

/** Top banner on the list page. */
export default function Hero({ total, ready }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Scene className="hero__scene" />
      <div className="hero__shade" />
      <div className="hero__content">
        <p className="hero__eyebrow">Hotel catalogue</p>
        <h1 id="hero-title">Find your next stay</h1>
        <p className="hero__lead">Search by name, narrow by nightly price and open any listing to see exactly where it is.</p>
        <ul className="hero__pills" aria-label="Highlights">
          <li>{ready ? `${total} ${total === 1 ? 'stay' : 'stays'} listed` : 'Loading stays…'}</li>
          <li>Map on every listing</li>
          <li>Prices in ₹ per night</li>
        </ul>
      </div>
    </section>
  );
}

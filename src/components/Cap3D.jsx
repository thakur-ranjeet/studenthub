// A graduation cap (mortarboard) built from CSS 3D shapes. Turns slowly. Decorative only.
export default function Cap3D() {
  return (
    <div className="cap-stage" aria-hidden="true">
      <div className="cap-bob">
        <div className="cap">
          <div className="cap-base">
            <i className="cb-front" /><i className="cb-back" /><i className="cb-left" /><i className="cb-right" /><i className="cb-bottom" />
          </div>
          <div className="cap-board">
            <span className="cap-button" />
            <span className="cap-cord"><span className="cap-tassel" /></span>
          </div>
        </div>
      </div>
      <div className="cap-shadow" />
    </div>
  );
}

import AuthMenu from "./AuthMenu";
import MobileNav from "./MobileNav";

/** Keep visual and keyboard order identical on every public page. */
export default function HeaderActions() {
  return (
    <div className="nav-actions">
      <AuthMenu />
      <MobileNav />
    </div>
  );
}

import { Outlet } from 'react-router-dom';

/** Login page is self-contained; layout only provides the outlet. */
export default function AuthLayout() {
  return <Outlet />;
}

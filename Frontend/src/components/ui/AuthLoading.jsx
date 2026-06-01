import Spinner from './Spinner';

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-10 w-10" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

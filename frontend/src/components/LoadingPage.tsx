import LoadingIndicator from "./LoadingIndicator";

function LoadingPage() {
    console.log('LoadingPage - Rendering LoadingPage component');
    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-200 dark:bg-neutral-800">
            <LoadingIndicator />
        </div>
    );
}

export default LoadingPage;
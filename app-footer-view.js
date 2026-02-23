(() => {
    const AppFooterView = ({ princeHintMessage, appName }) => (
        <>
            <div className="hidden md:block fixed right-4 bottom-5 z-30 pointer-events-none">
                <div className="max-w-[250px] rounded-2xl theme-surface backdrop-blur-sm shadow-lg px-3 py-2 prince-talk">
                    <div className="text-[11px] leading-5 font-black theme-text-main">{princeHintMessage}</div>
                </div>
                <div className="mt-2 flex items-end justify-end gap-1">
                    <div className="text-2xl prince-sparkle">✨</div>
                    <div className="prince-float w-16 h-16 rounded-2xl theme-prince-avatar shadow-md flex items-center justify-center text-3xl">🤴</div>
                </div>
            </div>

            <footer className="mt-20 text-center theme-text-sub text-[10px] font-bold uppercase tracking-[0.22em] pb-10">
                {appName}
            </footer>
        </>
    );

    window.APP_FOOTER_VIEW = {
        AppFooterView
    };
})();

(() => {
    const { useEffect, useMemo, useRef, useState } = React;

    const pad2 = (value) => String(value).padStart(2, '0');

    const formatDateKey = (date) => {
        if (!(date instanceof Date)) return '';
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${pad2(month)}-${pad2(day)}`;
    };

    const parseDateKey = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) return null;
        return date;
    };

    const formatMonthKey = (date) => {
        if (!(date instanceof Date)) return '';
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}-${pad2(month)}`;
    };

    const parseMonthKey = (value) => {
        if (!/^\d{4}-\d{2}$/.test(value || '')) return null;
        const [year, month] = value.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        if (date.getFullYear() !== year || date.getMonth() !== (month - 1)) return null;
        return date;
    };

    const toEvent = (value) => ({ target: { value } });

    const getPanelStyle = (wrapperEl, panelWidth, panelHeight) => {
        if (!wrapperEl) return { top: 0, left: 0 };
        const rect = wrapperEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const gap = 8;

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        const openUpward = spaceBelow < panelHeight + gap && spaceAbove > spaceBelow;
        const top = openUpward ? Math.max(gap, rect.top - panelHeight - gap) : rect.bottom + gap;

        let left = rect.left;
        if (left + panelWidth > viewportWidth - gap) {
            left = rect.right - panelWidth;
        }
        left = Math.max(gap, Math.min(left, viewportWidth - panelWidth - gap));

        return { top, left };
    };

    const useClickOutside = (refs, handler) => {
        useEffect(() => {
            const onClick = (event) => {
                const isInside = refs.some(ref => ref.current && ref.current.contains(event.target));
                if (!isInside) handler();
            };
            document.addEventListener('mousedown', onClick);
            return () => document.removeEventListener('mousedown', onClick);
        }, [refs, handler]);
    };

    const DatePicker = ({
        value,
        onChange,
        className = '',
        required = false,
        disabled = false,
        min,
        max,
        placeholder,
        pageLanguage = 'zh-Hant'
    }) => {
        const [open, setOpen] = useState(false);
        const [draft, setDraft] = useState(value || '');
        const [viewDate, setViewDate] = useState(() => parseDateKey(value) || new Date());
        const [panelMode, setPanelMode] = useState('day');
        const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0 });
        const wrapperRef = useRef(null);
        const panelRef = useRef(null);

        useEffect(() => {
            setDraft(value || '');
            if (value) {
                const parsed = parseDateKey(value);
                if (parsed) setViewDate(parsed);
            }
        }, [value]);

        useClickOutside([wrapperRef, panelRef], () => setOpen(false));

        useEffect(() => {
            if (!open) return;
            const update = () => {
                setPanelStyle(getPanelStyle(wrapperRef.current, 288, 260));
            };
            update();
            window.addEventListener('resize', update);
            window.addEventListener('scroll', update, true);
            return () => {
                window.removeEventListener('resize', update);
                window.removeEventListener('scroll', update, true);
            };
        }, [open]);

        const monthLabels = pageLanguage === 'ja-JP'
            ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            : pageLanguage === 'en-US'
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

        const weekdayLabels = pageLanguage === 'ja-JP'
            ? ['日', '月', '火', '水', '木', '金', '土']
            : pageLanguage === 'en-US'
                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                : ['日', '一', '二', '三', '四', '五', '六'];

        const minDate = useMemo(() => parseDateKey(min), [min]);
        const maxDate = useMemo(() => parseDateKey(max), [max]);

        const isSelectable = (date) => {
            if (!date) return false;
            if (minDate && date.getTime() < minDate.getTime()) return false;
            if (maxDate && date.getTime() > maxDate.getTime()) return false;
            return true;
        };

        const onInputChange = (event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = parseDateKey(next);
            if (parsed && isSelectable(parsed)) {
                onChange?.(toEvent(formatDateKey(parsed)));
            }
        };

        const onInputBlur = () => {
            const parsed = parseDateKey(draft);
            if (!parsed || !isSelectable(parsed)) {
                setDraft(value || '');
                return;
            }
            onChange?.(toEvent(formatDateKey(parsed)));
        };

        const calendarCells = useMemo(() => {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < firstDay; i += 1) cells.push(null);
            for (let day = 1; day <= daysInMonth; day += 1) {
                cells.push(new Date(year, month, day));
            }
            while (cells.length % 7 !== 0) cells.push(null);
            return cells;
        }, [viewDate]);

        const placeholderText = placeholder || (pageLanguage === 'en-US' ? 'YYYY-MM-DD' : 'YYYY-MM-DD');
        const monthLabel = `${monthLabels[viewDate.getMonth()]}`;
        const yearLabel = `${viewDate.getFullYear()}`;
        const today = new Date();
        const todayKey = formatDateKey(today);

        const yearRangeStart = Math.floor(viewDate.getFullYear() / 12) * 12;
        const yearOptions = Array.from({ length: 12 }, (_, idx) => yearRangeStart + idx);

        const panelPositionStyle = {
            top: `${panelStyle.top}px`,
            left: `${panelStyle.left}px`
        };

        return (
            <div className="relative" ref={wrapperRef}>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}-\d{2}-\d{2}"
                    placeholder={placeholderText}
                    className={className}
                    value={draft}
                    onChange={onInputChange}
                    onFocus={() => { setOpen(true); setPanelMode('day'); }}
                    onBlur={onInputBlur}
                    required={required}
                    disabled={disabled}
                />
                {open && !disabled && (
                    <div
                        ref={panelRef}
                        className="fixed z-50 w-72 rounded-2xl theme-surface p-3 shadow-xl"
                        style={panelPositionStyle}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                className="px-2 py-1 rounded-md theme-tab-inactive text-xs font-black"
                                onClick={() => {
                                    if (panelMode === 'year') {
                                        setViewDate(prev => new Date(prev.getFullYear() - 12, prev.getMonth(), 1));
                                    } else {
                                        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                    }
                                }}
                            >
                                {'<'}
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="text-sm font-black theme-text-main"
                                    onClick={() => setPanelMode(prev => (prev === 'month' ? 'day' : 'month'))}
                                >
                                    {monthLabel}
                                </button>
                                <button
                                    type="button"
                                    className="text-sm font-black theme-text-main"
                                    onClick={() => setPanelMode(prev => (prev === 'year' ? 'day' : 'year'))}
                                >
                                    {yearLabel}
                                </button>
                            </div>
                            <button
                                type="button"
                                className="px-2 py-1 rounded-md theme-tab-inactive text-xs font-black"
                                onClick={() => {
                                    if (panelMode === 'year') {
                                        setViewDate(prev => new Date(prev.getFullYear() + 12, prev.getMonth(), 1));
                                    } else {
                                        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                    }
                                }}
                            >
                                {'>'}
                            </button>
                        </div>

                        {panelMode === 'year' && (
                            <div className="grid grid-cols-3 gap-2">
                                {yearOptions.map(year => (
                                    <button
                                        key={year}
                                        type="button"
                                        className={`py-2 rounded-lg text-xs font-black transition-all ${year === viewDate.getFullYear() ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                                        onClick={() => {
                                            setViewDate(prev => new Date(year, prev.getMonth(), 1));
                                            setPanelMode('month');
                                        }}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        )}

                        {panelMode === 'month' && (
                            <div className="grid grid-cols-3 gap-2">
                                {monthLabels.map((label, index) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className={`py-2 rounded-lg text-xs font-black transition-all ${index === viewDate.getMonth() ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                                        onClick={() => {
                                            setViewDate(prev => new Date(prev.getFullYear(), index, 1));
                                            setPanelMode('day');
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {panelMode === 'day' && (
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {weekdayLabels.map((label, index) => (
                                    <div
                                        key={label}
                                        className={`text-[10px] font-black text-center ${index === 0 ? 'text-rose-500' : index === 6 ? 'text-indigo-500' : 'text-slate-400'}`}
                                    >
                                        {label}
                                    </div>
                                ))}
                                {calendarCells.map((date, index) => {
                                    if (!date) return <div key={`empty-${index}`} className="h-8" />;
                                    const dateKey = formatDateKey(date);
                                    const isActive = dateKey === value;
                                    const isToday = dateKey === todayKey;
                                    const dayOfWeek = date.getDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    const weekendTextClass = !isActive
                                        ? (dayOfWeek === 0 ? 'text-rose-500' : (dayOfWeek === 6 ? 'text-indigo-500' : ''))
                                        : '';
                                    const enabled = isSelectable(date);
                                    return (
                                        <button
                                            key={dateKey}
                                            type="button"
                                            className={`h-8 rounded-md text-xs font-black transition-all ${isActive ? 'theme-tab-active' : 'theme-tab-inactive'} ${isToday ? 'ring-2 ring-rose-200' : ''} ${weekendTextClass} ${!enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            onClick={() => {
                                                if (!enabled) return;
                                                onChange?.(toEvent(dateKey));
                                                setDraft(dateKey);
                                                setOpen(false);
                                            }}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const MonthPicker = ({
        value,
        onChange,
        className = '',
        required = false,
        disabled = false,
        pageLanguage = 'zh-Hant'
    }) => {
        const [open, setOpen] = useState(false);
        const [draft, setDraft] = useState(value || '');
        const [viewYear, setViewYear] = useState(() => {
            const parsed = parseMonthKey(value);
            return parsed ? parsed.getFullYear() : new Date().getFullYear();
        });
        const [panelMode, setPanelMode] = useState('month');
        const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0 });
        const wrapperRef = useRef(null);
        const panelRef = useRef(null);

        useEffect(() => {
            setDraft(value || '');
            const parsed = parseMonthKey(value);
            if (parsed) setViewYear(parsed.getFullYear());
        }, [value]);

        useClickOutside([wrapperRef, panelRef], () => setOpen(false));

        useEffect(() => {
            if (!open) return;
            const update = () => {
                setPanelStyle(getPanelStyle(wrapperRef.current, 256, 220));
            };
            update();
            window.addEventListener('resize', update);
            window.addEventListener('scroll', update, true);
            return () => {
                window.removeEventListener('resize', update);
                window.removeEventListener('scroll', update, true);
            };
        }, [open]);

        const monthLabels = pageLanguage === 'ja-JP'
            ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            : pageLanguage === 'en-US'
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();

        const onInputChange = (event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = parseMonthKey(next);
            if (parsed) {
                onChange?.(toEvent(formatMonthKey(parsed)));
            }
        };

        const onInputBlur = () => {
            const parsed = parseMonthKey(draft);
            if (!parsed) {
                setDraft(value || '');
                return;
            }
            onChange?.(toEvent(formatMonthKey(parsed)));
        };

        const placeholderText = pageLanguage === 'en-US' ? 'YYYY-MM' : 'YYYY-MM';
        const yearRangeStart = Math.floor(viewYear / 12) * 12;
        const yearOptions = Array.from({ length: 12 }, (_, idx) => yearRangeStart + idx);
        const panelPositionStyle = {
            top: `${panelStyle.top}px`,
            left: `${panelStyle.left}px`
        };

        return (
            <div className="relative" ref={wrapperRef}>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}-\d{2}"
                    placeholder={placeholderText}
                    className={className}
                    value={draft}
                    onChange={onInputChange}
                    onFocus={() => { setOpen(true); setPanelMode('month'); }}
                    onBlur={onInputBlur}
                    required={required}
                    disabled={disabled}
                />
                {open && !disabled && (
                    <div
                        ref={panelRef}
                        className="fixed z-50 w-64 rounded-2xl theme-surface p-3 shadow-xl"
                        style={panelPositionStyle}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                className="px-2 py-1 rounded-md theme-tab-inactive text-xs font-black"
                                onClick={() => setViewYear(prev => prev - (panelMode === 'year' ? 12 : 1))}
                            >
                                {'<'}
                            </button>
                            <button
                                type="button"
                                className="text-sm font-black theme-text-main"
                                onClick={() => setPanelMode(prev => (prev === 'year' ? 'month' : 'year'))}
                            >
                                {viewYear}
                            </button>
                            <button
                                type="button"
                                className="px-2 py-1 rounded-md theme-tab-inactive text-xs font-black"
                                onClick={() => setViewYear(prev => prev + (panelMode === 'year' ? 12 : 1))}
                            >
                                {'>'}
                            </button>
                        </div>
                        {panelMode === 'year' && (
                            <div className="grid grid-cols-3 gap-2">
                                {yearOptions.map(year => (
                                    <button
                                        key={year}
                                        type="button"
                                        className={`py-2 rounded-lg text-xs font-black transition-all ${year === viewYear ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                                        onClick={() => {
                                            setViewYear(year);
                                            setPanelMode('month');
                                        }}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        )}

                        {panelMode === 'month' && (
                            <div className="grid grid-cols-3 gap-2">
                                {monthLabels.map((label, index) => {
                                    const monthKey = `${viewYear}-${pad2(index + 1)}`;
                                    const isActive = monthKey === value;
                                    const isTodayMonth = viewYear === todayYear && index === todayMonth;
                                    return (
                                        <button
                                            key={monthKey}
                                            type="button"
                                            className={`py-2 rounded-lg text-xs font-black transition-all ${isActive ? 'theme-tab-active' : 'theme-tab-inactive'} ${isTodayMonth ? 'ring-2 ring-rose-200' : ''}`}
                                            onClick={() => {
                                                onChange?.(toEvent(monthKey));
                                                setDraft(monthKey);
                                                setOpen(false);
                                            }}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    window.APP_DATE_PICKER = {
        DatePicker,
        MonthPicker
    };
})();

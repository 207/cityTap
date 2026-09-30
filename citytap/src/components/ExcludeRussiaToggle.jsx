function ExcludeRussiaToggle({ excludeRussia, onChange }) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.checked);
  };

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        userSelect: 'none',
        marginLeft: '8px'
      }}
    >
      <input
        type="checkbox"
        checked={excludeRussia}
        onChange={handleChange}
        style={{
          width: '14px',
          height: '14px',
          cursor: 'pointer',
          accentColor: 'var(--accent)'
        }}
      />
      <span>Exclude Russia</span>
    </label>
  );
}

export default ExcludeRussiaToggle;

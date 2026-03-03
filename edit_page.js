const fs = require('fs');
let code = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

const t1 = `    // Editing States
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');`;

const r1 = `    // Editing States
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupDesc, setEditGroupDesc] = useState('');`;

const t2 = `    const handleDeleteStory = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Story', message: 'Delete this story forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(\`/api/admin/stories/\${id}\`, { method: 'DELETE' });
        if (res.ok) showStatus('Story deleted successfully.', true);
        else showStatus(\`Failed to delete story\`, false);
        fetchData();
    };`;

const r2 = `    const handleDeleteStory = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Story', message: 'Delete this story forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(\`/api/admin/stories/\${id}\`, { method: 'DELETE' });
        if (res.ok) showStatus('Story deleted successfully.', true);
        else showStatus(\`Failed to delete story\`, false);
        fetchData();
    };

    const handleUpdateGroup = async (id: number) => {
        const res = await fetch(\`/api/admin/groups/\${id}\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editGroupName, description: editGroupDesc }),
        });
        if (res.ok) showStatus('Group updated successfully.', true);
        else showStatus(\`Failed to update group\`, false);
        setEditingGroupId(null);
        fetchData();
    };

    const handleDeleteGroup = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Group', message: 'Delete this group forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(\`/api/admin/groups/\${id}\`, { method: 'DELETE' });
        if (res.ok) showStatus('Group deleted successfully.', true);
        else showStatus(\`Failed to delete group\`, false);
        fetchData();
    };`;

const t3 = `                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(g => (
                                        <tr key={g.id}>
                                            <td title={g.name}><b>{g.name}</b></td>
                                            <td title={g.description}>{g.description?.slice(0, 80) ?? '—'}</td>
                                        </tr>
                                    ))}
                                    {groups.length === 0 && (
                                        <tr><td colSpan={2} className={styles.empty}>No groups yet</td></tr>
                                    )}`;

const r3 = `                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(g => (
                                        <tr key={g.id}>
                                            <td title={g.name}>
                                                {editingGroupId === g.id ? (
                                                    <input className={styles.inlineInput} style={{ width: '100px' }} value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
                                                ) : (
                                                    <b>{g.name}</b>
                                                )}
                                            </td>
                                            <td title={g.description}>
                                                {editingGroupId === g.id ? (
                                                    <input className={styles.inlineInput} value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} />
                                                ) : (
                                                    g.description?.slice(0, 80) ?? '—'
                                                )}
                                            </td>
                                            <td>
                                                {editingGroupId === g.id ? (
                                                    <span className={styles.actionGroup}>
                                                        <button className={styles.saveBtn} onClick={() => handleUpdateGroup(g.id)}>Save</button>
                                                        <button className={styles.cancelBtn} onClick={() => setEditingGroupId(null)}>✕</button>
                                                    </span>
                                                ) : (
                                                    <span className={styles.actionGroup}>
                                                        <button className={styles.editBtn} onClick={() => { setEditingGroupId(g.id); setEditGroupName(g.name); setEditGroupDesc(g.description || ''); }}>✏️</button>
                                                        <button className={styles.deleteBtn} onClick={() => handleDeleteGroup(g.id)}>🗑️</button>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {groups.length === 0 && (
                                        <tr><td colSpan={3} className={styles.empty}>No groups yet</td></tr>
                                    )}`;

let mod = code.replace(t1, r1);
mod = mod.replace(t2, r2);
mod = mod.replace(t3, r3);

fs.writeFileSync('src/app/admin/page.tsx', mod);
console.log('Update successful');

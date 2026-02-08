document.addEventListener('DOMContentLoaded', () => {
    loadLogs();
    document.getElementById('logForm').addEventListener('submit', addLog);
    document.getElementById('btnDownloadWord').addEventListener('click', generateWord);
});

let currentLogs = [];

async function loadLogs() {
    try {
        const response = await fetch('/api/logs');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }
        currentLogs = await response.json();
        renderTable(currentLogs);
    } catch (error) {
        console.error("Load Logs Error:", error);
        alert('Gagal memuat data agenda: ' + error.message);
    }
}

function renderTable(logs) {
    const tbody = document.querySelector('#logsTable tbody');
    tbody.innerHTML = '';

    logs.forEach((log, index) => {
        const tr = document.createElement('tr');

        // Format Tatap Muka for Display (HTML)
        let tatapMukaHtml = [];
        if (log.kls) tatapMukaHtml.push(`<strong>KLS:</strong> ${log.kls}`);
        if (log.cp) tatapMukaHtml.push(`<strong>CP:</strong> ${log.cp}`);
        if (log.tp) tatapMukaHtml.push(`<strong>TP:</strong> ${log.tp}`);

        tr.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>${formatDateIndo(log.tanggal)}</td>
            <td>${tatapMukaHtml.join('<br>')}</td>
            <td>${log.non_tatap || '-'}</td>
            <td>${log.dok || ''}</td>
            <td>${log.vol || ''}</td>
            <td>${log.ket || ''}</td>
            <td class="text-center">
                <button class="btn btn-danger btn-sm" onclick="deleteLog(${log.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function addLog(e) {
    e.preventDefault();

    const data = {
        tanggal: document.getElementById('logTanggal').value,
        kls: document.getElementById('logKls').value,
        cp: document.getElementById('logCp').value,
        tp: document.getElementById('logTp').value,
        non_tatap: document.getElementById('logNonTatap').value,
        dok: document.getElementById('logDok').value,
        vol: document.getElementById('logVol').value,
        ket: document.getElementById('logKet').value
    };

    try {
        const response = await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error || errorData.message || 'Unknown server error');
        }

        // Reset form and reload
        document.getElementById('logForm').reset();
        loadLogs();
    } catch (error) {
        console.error("Add Log Error:", error);
        alert('Gagal menyimpan log: ' + error.message);
    }
}

// Make deleteLog available globally
window.deleteLog = async function(id) {
    if (!confirm('Yakin ingin menghapus log ini?')) return;

    try {
        const response = await fetch(`/api/logs?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: response.statusText }));
             throw new Error(errorData.error || 'Unknown server error');
        }
        loadLogs();
    } catch (error) {
        console.error("Delete Log Error:", error);
        alert('Gagal menghapus log: ' + error.message);
    }
};

function formatDateIndo(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
}

async function generateWord() {
    const kelas = document.getElementById('inputKelas').value;
    const tapel = document.getElementById('inputTapel').value;
    const bulan = document.getElementById('inputBulan').value;

    if (!kelas || !tapel || !bulan) {
        alert('Mohon lengkapi Header Laporan (Kelas, Tahun Ajaran, Bulan) terlebih dahulu!');
        return;
    }

    if (currentLogs.length === 0) {
        alert('Belum ada data agenda harian untuk dicetak.');
        return;
    }

    loadFile("template.docx", function(error, content) {
        if (error) { throw error };

        const zip = new PizZip(content);
        const doc = new window.docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Prepare Data for Template
        const reportData = {
            kelas: kelas,
            tapel: tapel,
            bulan: bulan,
            harian: currentLogs.map((log, index) => {
                // Construct Tatap Muka String with Newlines
                let tatapParts = [];
                // Order as requested: CP, TP, KLS or similar.
                // Previous request said: "CP: ... \n TP: ... \n KLS: ..."
                // Image showed: CP, TP, KLS
                if (log.cp) tatapParts.push(`CP: ${log.cp}`);
                if (log.tp) tatapParts.push(`TP: ${log.tp}`);
                if (log.kls) tatapParts.push(`KLS: ${log.kls}`);

                return {
                    no: index + 1,
                    hari_tgl: formatDateIndo(log.tanggal),
                    tatap_muka: tatapParts.join('\n'), // This needs docxtemplater linebreaks: true
                    non_tatap: log.non_tatap || '',
                    dok: log.dok || '',
                    vol: log.vol || '',
                    ket: log.ket || ''
                };
            })
        };

        try {
            // Render the document
            doc.render(reportData);
        } catch (error) {
            console.error("Template Errors:", error);
             if (error.properties && error.properties.errors instanceof Array) {
                const errorMessages = error.properties.errors.map(function (error) {
                    return error.properties.explanation;
                }).join("\n");
                console.log('errorMessages', errorMessages);
                // errorMessages is a humanly readable message looking like this :
                // 'The tag beginning with "foobar" is unopened'
            }
            alert('Gagal generate Word: ' + error.message);
            return;
        }

        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        saveAs(out, `LKH_${bulan}_${new Date().getTime()}.docx`);
    });
}

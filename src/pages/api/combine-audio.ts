import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export default async function handler(req, res) {
    try {
        // Test ffmpeg installation
        const { stdout } = await execFileAsync(ffmpegPath, ['-version']);
        console.log('FFmpeg version:', stdout);

        // ... existing code to handle audio combination ...

    } catch (error) {
        console.error('Error in combine-audio:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

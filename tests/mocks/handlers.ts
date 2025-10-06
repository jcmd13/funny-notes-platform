import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock OCR service
  http.post('/api/ocr', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return HttpResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Mock OCR response based on filename for predictable testing
    const mockText = file.name.includes('joke') 
      ? 'Why did the chicken cross the road? To get to the other side!'
      : 'Sample extracted text from image';

    return HttpResponse.json({
      text: mockText,
      confidence: 0.95,
    });
  }),

  // Mock speech-to-text service
  http.post('/api/transcribe', async ({ request }) => {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    
    if (!audio) {
      return HttpResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    // Mock transcription response
    return HttpResponse.json({
      text: 'This is a mock transcription of the audio content.',
      confidence: 0.92,
      duration: 5.2,
    });
  }),

  // Mock AI tagging service
  http.post('/api/suggest-tags', async ({ request }) => {
    const { content } = await request.json();
    
    // Mock tag suggestions based on content
    const tags = [];
    if (content.toLowerCase().includes('chicken')) {
      tags.push('classic-setup', 'animals', 'puns');
    }
    if (content.toLowerCase().includes('stage')) {
      tags.push('performance', 'venue');
    }
    if (content.toLowerCase().includes('audience')) {
      tags.push('crowd-work', 'interaction');
    }
    
    return HttpResponse.json({
      tags: tags.length > 0 ? tags : ['general', 'comedy'],
      confidence: 0.88,
    });
  }),

  // Mock sync service
  http.post('/api/sync', async ({ request }) => {
    const data = await request.json();
    
    return HttpResponse.json({
      success: true,
      synced: data.items?.length || 0,
      conflicts: [],
    });
  }),

  // Mock error scenarios for testing
  http.post('/api/error-test', () => {
    return HttpResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    );
  }),
];
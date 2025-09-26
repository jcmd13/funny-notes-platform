import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  TagChip,
  TagInput,
  ConfirmDialog,
  LoadingSpinner,
  Skeleton,
  FloatingActionButton,
  Form,
  FormField,
  Textarea
} from './index';

const UIDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tags, setTags] = useState(['comedy', 'observational']);
  const [loading, setLoading] = useState(false);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">UI Component Demo</h1>
      
      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Loading</Button>
          </div>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <Form className="space-y-4">
            <FormField>
              <Input label="Note Title" placeholder="Enter a title..." />
            </FormField>
            <FormField>
              <Input 
                label="Email" 
                type="email" 
                error="Please enter a valid email"
                placeholder="your@email.com" 
              />
            </FormField>
            <FormField>
              <Textarea 
                label="Note Content" 
                placeholder="Write your comedy material here..."
                rows={4}
              />
            </FormField>
          </Form>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tag System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <TagChip tag="comedy" />
              <TagChip tag="observational" variant="removable" onRemove={() => {}} />
              <TagChip tag="clickable" variant="clickable" onClick={() => alert('Tag clicked!')} />
            </div>
            <TagInput
              tags={tags}
              onTagsChange={setTags}
              suggestions={['comedy', 'observational', 'storytelling', 'crowd-work', 'callback']}
              placeholder="Add comedy tags..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-full" />
              <Skeleton className="w-3/4" />
              <Skeleton className="w-1/2" />
            </div>
            <Button onClick={handleLoadingTest} loading={loading}>
              Test Loading State
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      <Card>
        <CardHeader>
          <CardTitle>Modals & Dialogs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Button onClick={() => setConfirmOpen(true)} variant="destructive">
              Delete Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => alert('Quick capture!')}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This is an example modal with the comedy club theme. It demonstrates
            the dark styling and amber accents.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => alert('Item deleted!')}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default UIDemo;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import SkUpdateDataButton, { refreshDataIntervalMap } from '../../src/core/components/SkUpdateDataButton';
import { Wrapper } from '../../src/core/components/Wrapper';

describe('SkUpdateDataButton component', () => {
  it('should renders the component with "Refresh off" text', () => {
    render(
      <Wrapper>
        <SkUpdateDataButton />
      </Wrapper>
    );

    expect(screen.getByText('Refresh off')).toBeInTheDocument();
  });

  it('should opens the refresh interval dropdown on button click', async () => {
    const onClickMock = jest.fn();
    render(
      <Wrapper>
        <SkUpdateDataButton onClick={onClickMock} />
      </Wrapper>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('Refresh off'));
      expect(screen.getByText(refreshDataIntervalMap[1].label)).toBeInTheDocument();
    });
  });

  it('calls onRefreshIntervalSelected and revalidateLiveQueries when a new interval is selected', async () => {
    const onRefreshIntervalSelectedMock = jest.fn();
    const revalidateLiveQueriesMock = jest.fn();

    render(
      <Wrapper>
        <SkUpdateDataButton
          onRefreshIntervalSelected={onRefreshIntervalSelectedMock}
          onClick={revalidateLiveQueriesMock}
        />
      </Wrapper>
    );

    fireEvent.click(screen.getByText(refreshDataIntervalMap[0].label));
    fireEvent.click(screen.getByText(refreshDataIntervalMap[2].label));

    await waitFor(() => {
      // call the first one and the one inside the setInterval
      expect(revalidateLiveQueriesMock).toHaveBeenCalledTimes(1);
      expect(onRefreshIntervalSelectedMock).toHaveBeenCalledWith(Number(refreshDataIntervalMap[2].id));
    });
  });

  it('should calls functions on refresh interval selection', async () => {
    const revalidateLiveQueriesMock = jest.fn();
    render(
      <Wrapper>
        <SkUpdateDataButton onClick={revalidateLiveQueriesMock} refreshIntervalDefault={'15'} />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('update-data-click'));
    await waitFor(() => expect(revalidateLiveQueriesMock).toHaveBeenCalledTimes(1));
  });
});
